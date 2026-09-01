import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/v1/history/sessions/route";
import { POST as POST_ANSWERS } from "@/app/api/v1/history/sessions/[sessionId]/answers/route";
import { POST as POST_COMPLETE } from "@/app/api/v1/history/sessions/[sessionId]/complete/route";

vi.mock("@/db", async () => {
  const { memoryDb, memoryDbHistory } = await import("@/test/memory-db");
  return { db: { ...memoryDb, ...memoryDbHistory } };
});
vi.mock("@/lib/auth/guards", async () => {
  const { sessionState } = await import("@/test/memory-db");
  const { UnauthorizedError, ForbiddenError } = await import("@/lib/errors");
  return {
    requireAuth: async () => {
      if (!sessionState.value) throw new UnauthorizedError();
      return sessionState.value;
    },
    requireRole: async (allowed: Role | Role[]) => {
      if (!sessionState.value) throw new UnauthorizedError();
      const roles = Array.isArray(allowed) ? allowed : [allowed];
      if (!roles.includes(sessionState.value.user.role)) {
        throw new ForbiddenError("Insufficient role permissions");
      }
      return sessionState.value;
    },
  };
});
vi.mock("@/lib/auth/notifications", () => ({ recordAuditEvent: vi.fn() }));

import { resetMemoryDb, seedUser, setSession, getHistorySessions } from "@/test/memory-db";

function jsonReq(path: string, payload: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/v1/history/sessions", () => {
  beforeEach(() => resetMemoryDb());

  it("returns 401 without a session", async () => {
    const res = await POST(jsonReq("/sessions", {}));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a doctor", async () => {
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    const res = await POST(jsonReq("/sessions", {}));
    expect(res.status).toBe(403);
  });

  it("creates a session with a first question for a patient", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await POST(jsonReq("/sessions", {}));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.session.status).toBe("IN_PROGRESS");
    expect(body.data.currentQuestion.section).toBe("CHIEF_COMPLAINT");
    expect(getHistorySessions()).toHaveLength(1);
  });

  it("rejects an invalid framework value", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await POST(jsonReq("/sessions", { framework: "HOMEOPATHY" }));
    expect(res.status).toBe(422);
    expect(getHistorySessions()).toHaveLength(0);
  });

  it("treats a malformed JSON body like an empty payload", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const req = new NextRequest("http://localhost/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(getHistorySessions()).toHaveLength(1);
  });
});

describe("GET /api/v1/history/sessions", () => {
  beforeEach(() => resetMemoryDb());

  it("returns an empty page for a patient with no sessions", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await GET(new NextRequest("http://localhost/sessions"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });
});

const VALID_CUID = "c0000000000000000000000001";
const invalidCuidCtx = async () => ({ params: Promise.resolve({ sessionId: "not-a-cuid" }) });

describe("POST /api/v1/history/sessions/:id/answers", () => {
  beforeEach(() => resetMemoryDb());

  it("returns 401 without a session", async () => {
    const res = await POST_ANSWERS(jsonReq("/sessions/cmx/answers", { questionId: VALID_CUID, answer: "x" }));
    expect(res.status).toBe(401);
  });

  it("returns 422 for an invalid answer body", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await POST_ANSWERS(
      jsonReq("/sessions/cmx/answers", { questionId: "not-a-cuid", answer: "symptoms" }),
      { params: Promise.resolve({ sessionId: VALID_CUID }) }
    );
    expect(res.status).toBe(422);
  });

  it("returns 422 for an empty answer", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await POST_ANSWERS(
      jsonReq("/sessions/cmx/answers", { questionId: VALID_CUID, answer: "" }),
      { params: Promise.resolve({ sessionId: VALID_CUID }) }
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/history/sessions/:id/complete", () => {
  beforeEach(() => resetMemoryDb());

  it("returns 403 for a doctor", async () => {
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    const res = await POST_COMPLETE(jsonReq("/sessions/cmx/complete", {}));
    expect(res.status).toBe(403);
  });

  it("returns 422 for an invalid session id", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const res = await POST_COMPLETE(jsonReq("/sessions/not-a-cuid/complete", {}), await invalidCuidCtx());
    expect(res.status).toBe(422);
  });
});