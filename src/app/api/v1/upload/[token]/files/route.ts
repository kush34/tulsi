import { NextRequest } from "next/server";
import { DocumentType } from "@prisma/client";
import { db } from "@/db";
import { resolveUploadToken } from "@/lib/documents/upload-tokens";
import { storageConfigured, uploadMedicalDocument } from "@/lib/storage/supabase";
import { checkRateLimit } from "@/lib/auth/rate-limit-route";
import { NotFoundError, ServiceUnavailableError, ValidationError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { successResponse } from "@/lib/utils/api-response";
import { withErrorHandling } from "@/lib/middleware";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_DOC_TYPES: DocumentType[] = [
  "PRESCRIPTION",
  "LAB_REPORT",
  "DISCHARGE_SUMMARY",
  "OTHER",
];

function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "upload";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "upload";
}

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withErrorHandling(async (req: NextRequest, context: unknown) => {
  const limited = checkRateLimit(req, "UPLOAD");
  if (limited) return limited;

  const { token } = await (context as RouteContext).params;
  const grant = await resolveUploadToken(token);
  if (!grant) throw new NotFoundError("Upload link");

  if (!storageConfigured()) {
    throw new ServiceUnavailableError("Document storage is not configured yet");
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const docType = String(form?.get("docType") ?? "OTHER");

  if (!(file instanceof File) || file.size === 0) {
    throw new ValidationError({ file: ["A file is required"] });
  }
  if (file.size > MAX_BYTES) {
    throw new ValidationError({ file: ["File must be smaller than 10 MB"] });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new ValidationError({ file: ["Only PDF, JPEG, PNG, or WebP files are accepted"] });
  }
  if (!ALLOWED_DOC_TYPES.includes(docType as DocumentType)) {
    throw new ValidationError({ docType: ["Invalid document type"] });
  }

  const fileName = sanitizeFileName(file.name);
  const storagePath = `${grant.patientId}/${Date.now()}-${fileName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await uploadMedicalDocument(bytes, storagePath, file.type);

  const document = await db.patientDocument.create({
    data: {
      patientId: grant.patientId,
      historySessionId: grant.historySessionId,
      fileName,
      mimeType: file.type,
      sizeBytes: file.size,
      storagePath,
      docType: docType as DocumentType,
    },
  });

  await recordAuditEvent({
    userId: grant.patientId,
    event: "DOCUMENTS.UPLOADED",
    metadata: { documentId: document.id, docType, sizeBytes: file.size },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return successResponse(
    { id: document.id, fileName: document.fileName, docType: document.docType },
    201,
  );
});
