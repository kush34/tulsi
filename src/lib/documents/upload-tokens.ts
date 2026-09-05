import crypto from "crypto";
import { db } from "@/db";

export const UPLOAD_TOKEN_TTL_MS = 30 * 60 * 1000;

export function generateUploadToken(): string {
  return crypto.randomBytes(9).toString("base64url");
}

export async function createUploadToken(patientId: string, historySessionId?: string | null) {
  return db.uploadToken.create({
    data: {
      token: generateUploadToken(),
      patientId,
      historySessionId: historySessionId ?? null,
      expiresAt: new Date(Date.now() + UPLOAD_TOKEN_TTL_MS),
    },
  });
}

export async function resolveUploadToken(token: string) {
  const record = await db.uploadToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return null;
  return record;
}
