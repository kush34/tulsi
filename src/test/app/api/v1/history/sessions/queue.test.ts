import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/v1/history/sessions/route";

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

import { resetMemoryDb, seedHistorySession, seedUser, setSession } from "@/test/memory-db";

describe("GET /api/v1/history/sessions as staff", () => {
  beforeEach(() => resetMemoryDb());

  it("includes patient identity for doctors", async () => {
    seedUser({ id: "u1", role: Role.PATIENT, name: "Asha Verma", email: "asha@example.com" });
    seedHistorySession({ patientId: "u1", status: "DOCTOR_REVIEW" });
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });

    const res = await GET(new NextRequest("http://localhost/sessions?status=DOCTOR_REVIEW&limit=10"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].patient).toMatchObject({
      id: "u1",
      name: "Asha Verma",
      email: "asha@example.com",
    });
  });

  it("hides patient identity from patient listings", async () => {
    seedUser({ id: "u1", role: Role.PATIENT, name: "Asha Verma", email: "asha@example.com" });
    seedHistorySession({ patientId: "u1", status: "DOCTOR_REVIEW" });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await GET(new NextRequest("http://localhost/sessions?status=DOCTOR_REVIEW&limit=10"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).not.toHaveProperty("patient");
  });
});
