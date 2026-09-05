import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST as POST_TOKEN } from "@/app/api/v1/upload-tokens/route";
import { GET as GET_DOCUMENTS } from "@/app/api/v1/documents/route";
import { GET as GET_UPLOAD } from "@/app/api/v1/upload/[token]/route";
import { POST as POST_FILE } from "@/app/api/v1/upload/[token]/files/route";

vi.mock("@/db", async () => {
  const { memoryDb, memoryDbHistory } = await import("@/test/memory-db");
  return { db: { ...memoryDb, ...memoryDbHistory } };
});
vi.mock("@/lib/auth/guards", async () => {
  const { sessionState } = await import("@/test/memory-db");
  const { UnauthorizedError } = await import("@/lib/errors");
  return {
    requireAuth: async () => {
      if (!sessionState.value) throw new UnauthorizedError();
      return sessionState.value;
    },
    requireRole: async () => {
      if (!sessionState.value) throw new UnauthorizedError();
      return sessionState.value;
    },
  };
});
vi.mock("@/lib/auth/notifications", () => ({ recordAuditEvent: vi.fn() }));
vi.mock("@/lib/storage/supabase", () => ({
  storageConfigured: vi.fn(() => true),
  uploadMedicalDocument: vi.fn(async (_b: unknown, path: string) => ({ path })),
}));

import {
  resetMemoryDb,
  seedPatientDocument,
  seedUploadToken,
  seedUser,
  setSession,
} from "@/test/memory-db";
import { storageConfigured } from "@/lib/storage/supabase";

function req(path: string, method = "GET", payload?: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

function ctx(token: string) {
  return { params: Promise.resolve({ token }) } as never;
}

function fileReq(token: string, file: File | null, docType = "LAB_REPORT"): NextRequest {
  const form = new FormData();
  if (file) form.set("file", file);
  form.set("docType", docType);
  return new NextRequest(`http://localhost/up/${token}/files`, { method: "POST", body: form });
}

describe("document upload flow", () => {
  beforeEach(() => resetMemoryDb());

  it("requires auth for token creation and listing", async () => {
    expect((await POST_TOKEN(req("/t", "POST", {}))).status).toBe(401);
    expect((await GET_DOCUMENTS(req("/d"))).status).toBe(401);
  });

  it("creates a short-lived upload token", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await POST_TOKEN(req("/t", "POST", {}));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.token).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(new Date(body.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("lists only the patient's own documents", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedUser({ id: "u2", role: Role.PATIENT });
    seedPatientDocument({ patientId: "u1", fileName: "mine.pdf" });
    seedPatientDocument({ patientId: "u2", fileName: "theirs.pdf" });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const body = await (await GET_DOCUMENTS(req("/d"))).json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].fileName).toBe("mine.pdf");
  });

  it("validates upload links", async () => {
    seedPatientDocument({});
    const good = seedUploadToken({ token: "goodtoken123", patientId: "u1" });
    void good;
    expect((await GET_UPLOAD(req("/u"), ctx("goodtoken123"))).status).toBe(200);
    expect((await GET_UPLOAD(req("/u"), ctx("expiredtoken1"))).status).toBe(404);

    seedUploadToken({ token: "oldtoken1234", patientId: "u1", expiresAt: new Date(Date.now() - 1000) });
    expect((await GET_UPLOAD(req("/u"), ctx("oldtoken1234"))).status).toBe(404);
  });

  it("accepts a valid phone upload", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedUploadToken({ token: "phonetoken12", patientId: "u1" });
    const file = new File(["%PDF-1.4 fake"], "lab.pdf", { type: "application/pdf" });

    const res = await POST_FILE(fileReq("phonetoken12", file), ctx("phonetoken12"));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.fileName).toBe("lab.pdf");

    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const listed = await (await GET_DOCUMENTS(req("/d"))).json();
    expect(listed.data).toHaveLength(1);
  });

  it("rejects bad uploads", async () => {
    seedUploadToken({ token: "phonetoken12", patientId: "u1" });
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    const exe = new File(["x"], "a.exe", { type: "application/x-msdownload" });
    const big = new File(["x".repeat(11 * 1024 * 1024)], "big.pdf", { type: "application/pdf" });

    expect((await POST_FILE(fileReq("nope-token-12", pdf), ctx("nope-token-12"))).status).toBe(404);
    expect((await POST_FILE(fileReq("phonetoken12", null), ctx("phonetoken12"))).status).toBe(422);
    expect((await POST_FILE(fileReq("phonetoken12", exe), ctx("phonetoken12"))).status).toBe(422);
    expect((await POST_FILE(fileReq("phonetoken12", big), ctx("phonetoken12"))).status).toBe(422);
    expect((await POST_FILE(fileReq("phonetoken12", pdf, "BOGUS"), ctx("phonetoken12"))).status).toBe(422);
  });

  it("returns 503 when storage is not configured", async () => {
    vi.mocked(storageConfigured).mockReturnValueOnce(false);
    seedUploadToken({ token: "phonetoken12", patientId: "u1" });
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });

    expect((await POST_FILE(fileReq("phonetoken12", file), ctx("phonetoken12"))).status).toBe(503);
  });
});
