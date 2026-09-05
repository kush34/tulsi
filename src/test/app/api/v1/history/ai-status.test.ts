import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/v1/history/ai-status/route";

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
  };
});
vi.mock("@/lib/ai", () => ({
  describeAIProvider: vi.fn(),
}));

import { resetMemoryDb, setSession } from "@/test/memory-db";
import { describeAIProvider } from "@/lib/ai";
import { Role } from "@prisma/client";

describe("GET /api/v1/history/ai-status", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.mocked(describeAIProvider).mockReset();
  });

  it("returns 401 without a session", async () => {
    const res = await GET(new NextRequest("http://localhost/ai-status"));
    expect(res.status).toBe(401);
  });

  it("exposes provider mode without secrets", async () => {
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    vi.mocked(describeAIProvider).mockReturnValue({
      provider: "openrouter",
      active: true,
      model: "meta/muse-spark-1.3",
    });

    const body = await (await GET(new NextRequest("http://localhost/ai-status"))).json();
    expect(body.data).toEqual({
      provider: "openrouter",
      active: true,
      model: "meta/muse-spark-1.3",
    });
    expect(JSON.stringify(body)).not.toContain("sk-or");
  });

  it("reports fallback mode", async () => {
    await setSession({ user: { id: "u1", role: Role.PATIENT } });
    vi.mocked(describeAIProvider).mockReturnValue({ provider: "none", active: false, model: null });

    const body = await (await GET(new NextRequest("http://localhost/ai-status"))).json();
    expect(body.data).toEqual({ provider: "none", active: false, model: null });
  });
});
