import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST as POST_SESSIONS } from "@/app/api/v1/history/sessions/route";
import { POST as POST_CANCEL } from "@/app/api/v1/history/sessions/[sessionId]/cancel/route";
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

import { resetMemoryDb, seedUser, setSession } from "@/test/memory-db";

function req(path: string, method = "POST", payload?: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

function ctx(sessionId: string) {
  return { params: Promise.resolve({ sessionId }) } as never;
}

describe("POST /api/v1/history/sessions/:id/cancel", () => {
  beforeEach(() => resetMemoryDb());

  it("returns 401 without a session", async () => {
    const res = await POST_CANCEL(req("/c"), ctx("c".repeat(25)));
    expect(res.status).toBe(401);
  });

  it("cancels an active session and blocks further answers", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const created = await (await POST_SESSIONS(req("/sessions", "POST", {}))).json();
    const sessionId = created.data.session.id as string;
    const questionId = created.data.currentQuestion.id as string;

    const cancelled = await POST_CANCEL(req(`/s/${sessionId}/cancel`), ctx(sessionId));
    expect(cancelled.status).toBe(200);
    expect((await cancelled.json()).data.status).toBe("CANCELLED");

    const answer = await POST_ANSWERS(
      req(`/s/${sessionId}/answers`, "POST", { questionId, answer: "too late" }),
      ctx(sessionId),
    );
    expect(answer.status).toBe(409);

    const again = await POST_CANCEL(req(`/s/${sessionId}/cancel`), ctx(sessionId));
    expect(again.status).toBe(409);
  });

  it("lets the patient start a fresh session afterwards", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const first = await (await POST_SESSIONS(req("/sessions", "POST", {}))).json();
    await POST_CANCEL(req("/s/cancel"), ctx(first.data.session.id as string));

    const second = await POST_SESSIONS(req("/sessions", "POST", {}));
    expect(second.status).toBe(201);
  });
});
