import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { GET as GET_TRANSCRIPT } from "@/app/api/v1/history/sessions/[sessionId]/transcript/route";
import { POST as POST_SESSIONS } from "@/app/api/v1/history/sessions/route";
import { GET as GET_SESSION } from "@/app/api/v1/history/sessions/[sessionId]/route";
import { POST as POST_ANSWERS } from "@/app/api/v1/history/sessions/[sessionId]/answers/route";

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
vi.mock("@/lib/ai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai")>("@/lib/ai");
  return { ...actual, createAIProvider: vi.fn(() => null) };
});

import { resetMemoryDb, seedUser, setSession } from "@/test/memory-db";

function req(path: string, method = "GET", payload?: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

function ctx(sessionId: string) {
  return { params: Promise.resolve({ sessionId }) } as never;
}

describe("GET /api/v1/history/sessions/:id/transcript", () => {
  beforeEach(() => resetMemoryDb());

  it("returns 401 without a session", async () => {
    const res = await GET_TRANSCRIPT(req("/t"), ctx("c".repeat(25)));
    expect(res.status).toBe(401);
  });

  it("records questions and answers in order", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const created = await (await POST_SESSIONS(req("/sessions", "POST", {}))).json();
    const sessionId = created.data.session.id as string;
    const questionId = created.data.currentQuestion.id as string;

    const answered = await POST_ANSWERS(
      req(`/s/${sessionId}/answers`, "POST", {
        questionId,
        answer: "Chest pain for two days",
        inputType: "VOICE",
      }),
      ctx(sessionId),
    );
    expect(answered.status).toBe(200);

    const res = await GET_TRANSCRIPT(req(`/s/${sessionId}/t`), ctx(sessionId));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.data.sessionId).toBe(sessionId);
    expect(body.data.entries).toHaveLength(2);
    expect(body.data.entries[0]).toMatchObject({
      sequence: 1,
      answer: "Chest pain for two days",
      inputType: "VOICE",
    });
    expect(body.data.entries[1].answer).toBeNull();

    const session = await (await GET_SESSION(req(`/s/${sessionId}`), ctx(sessionId))).json();
    expect(session.data.currentQuestion.id).toBe(body.data.entries[1].questionId);
  });

  it("isolates patients from each other's transcripts", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedUser({ id: "u2", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    const created = await (await POST_SESSIONS(req("/sessions", "POST", {}))).json();
    const sessionId = created.data.session.id as string;

    await setSession({ user: { id: "u2", role: Role.PATIENT } });
    const res = await GET_TRANSCRIPT(req(`/s/${sessionId}/t`), ctx(sessionId));
    expect(res.status).toBe(403);
  });
});
