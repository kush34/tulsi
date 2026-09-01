import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST as POST_CONFIRM } from "@/app/api/v1/history/sessions/[sessionId]/review/confirm/route";
import { GET as GET_REVIEW } from "@/app/api/v1/history/sessions/[sessionId]/review/route";
import { GET as GET_DOCTOR_REVIEW } from "@/app/api/v1/history/sessions/[sessionId]/doctor/review/route";
import { POST as POST_ADD_FACT } from "@/app/api/v1/history/sessions/[sessionId]/facts/route";
import { PATCH as PATCH_FACT } from "@/app/api/v1/history/sessions/[sessionId]/facts/[factId]/route";
import { POST as POST_VERIFY } from "@/app/api/v1/history/sessions/[sessionId]/facts/[factId]/verify/route";
import { POST as POST_RESOLVE } from "@/app/api/v1/history/sessions/[sessionId]/flags/[flagId]/resolve/route";
import { POST as POST_FINALIZE } from "@/app/api/v1/history/sessions/[sessionId]/finalize/route";

vi.mock("@/db", async () => {
  const { memoryDb, memoryDbHistory } = await import("@/test/memory-db");
  return { db: { ...memoryDb, ...memoryDbHistory } };
});
vi.mock("@/lib/auth/guards", async () => {
  const { sessionState } = await import("@/test/memory-db");
  const { UnauthorizedError, ForbiddenError } = await import("@/lib/errors");
  const ROLE_LEVELS = { PATIENT: 1, DOCTOR: 2, ADMIN: 3 };
  return {
    requireAuth: async () => {
      if (!sessionState.value) throw new UnauthorizedError();
      return sessionState.value;
    },
    requireRole: async (allowed: Role | Role[]) => {
      if (!sessionState.value) throw new UnauthorizedError();
      const roles = Array.isArray(allowed) ? allowed : [allowed];
      if (!roles.includes(sessionState.value.user.role)) throw new ForbiddenError("Permission denied");
      return sessionState.value;
    },
    requireAtLeastRole: async (minimum: Role) => {
      if (!sessionState.value) throw new UnauthorizedError();
      if (ROLE_LEVELS[sessionState.value.user.role] < ROLE_LEVELS[minimum]) {
        throw new ForbiddenError("Insufficient role permissions");
      }
      return sessionState.value;
    },
  };
});
vi.mock("@/lib/auth/notifications", () => ({ recordAuditEvent: vi.fn() }));

import { resetMemoryDb, seedUser, setSession, seedHistorySession, seedHistoryFact, seedHistoryFlag } from "@/test/memory-db";

function jsonReq(path: string, payload: unknown = {}): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

const params = (sessionId: string) => ({ params: Promise.resolve({ sessionId }) });
const factParams = (sessionId: string, factId: string) => ({ params: Promise.resolve({ sessionId, factId }) });
const flagParams = (sessionId: string, flagId: string) => ({ params: Promise.resolve({ sessionId, flagId }) });

describe("history review routes", () => {
  beforeEach(() => resetMemoryDb());

  it("confirm returns 401 without auth and 403 for a doctor", async () => {
    expect((await POST_CONFIRM(jsonReq("/confirm"), params("c0000000000000000000001"))).status).toBe(401);
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    const res = await POST_CONFIRM(jsonReq("/confirm"), params("c0000000000000000000001"));
    expect(res.status).toBe(403);
  });

  it("confirm succeeds for the owning patient and moves the session to DOCTOR_REVIEW", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });

    const res = await POST_CONFIRM(jsonReq(`/sessions/${session.id}/confirm`, {}), params(session.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("DOCTOR_REVIEW");
  });

  it("finalize requires a doctor and succeeds for a doctor on a DOCTOR_REVIEW session", async () => {
    expect((await POST_FINALIZE(jsonReq("/finalize"), params("c0000000000000000000001"))).status).toBe(401);
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const owned = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
    expect((await POST_FINALIZE(jsonReq("/finalize"), params(owned.id))).status).toBe(403);

    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    const res = await POST_FINALIZE(jsonReq(`/sessions/${owned.id}/finalize`, {}), params(owned.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("COMPLETED");
    expect(body.data.snapshot.isVerified).toBe(true);
  });

  it("verify requests a doctor and a DOCTOR_REVIEW session", async () => {
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
    const fact = seedHistoryFact({ sessionId: session.id });
    const res = await POST_VERIFY(jsonReq("/verify"), factParams(session.id, fact.id as string));
    expect(res.status).toBe(403);

    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    const ok = await POST_VERIFY(jsonReq("/verify"), factParams(session.id, fact.id as string));
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.data.verification).toBe("DOCTOR_VERIFIED");
  });

  it("lets a patient add a fact during PATIENT_REVIEW and returns 409 once locked", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });

    const ok = await POST_ADD_FACT(jsonReq(`/facts`, { section: "HPI", field: "duration", value: "two days" }), params(session.id));
    expect(ok.status).toBe(201);

    const locked = seedHistorySession({ status: "COMPLETED", patientId: "u1", completedAt: new Date() });
    const blocked = await POST_ADD_FACT(jsonReq(`/facts`, { section: "HPI", field: "duration", value: "two days" }), params(locked.id));
    expect(blocked.status).toBe(409);
  });

  it("does not let a doctor patch into a patient review session", async () => {
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
    const fact = seedHistoryFact({ sessionId: session.id });
    const res = await PATCH_FACT(jsonReq(`/facts/${fact.id}`, { value: "changed" }), factParams(session.id, fact.id as string));
    expect(res.status).toBe(409);
  });

  it("review GET is patient-only and doctor/review GET is doctor-only", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
    const getReq = new NextRequest("http://localhost/sessions/x/review");
    expect((await GET_REVIEW(getReq, params(session.id))).status).toBe(200);
    expect((await GET_DOCTOR_REVIEW(getReq, params(session.id))).status).toBe(403);

    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    expect((await GET_REVIEW(getReq, params(session.id))).status).toBe(403);
    expect((await GET_DOCTOR_REVIEW(getReq, params(session.id))).status).toBe(200);
  });

  it("resolve requires a doctor and rejects already-actioned flags", async () => {
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
    const flag = seedHistoryFlag({ sessionId: session.id });
    expect((await POST_RESOLVE(jsonReq("/resolve"), flagParams(session.id, flag.id as string))).status).toBe(403);

    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    const ok = await POST_RESOLVE(jsonReq("/resolve", { resolution: "clarified" }), flagParams(session.id, flag.id as string));
    expect(ok.status).toBe(200);
    const again = await POST_RESOLVE(jsonReq("/resolve"), flagParams(session.id, flag.id as string));
    expect(again.status).toBe(409);
  });
});