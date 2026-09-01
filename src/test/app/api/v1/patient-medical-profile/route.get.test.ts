import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/v1/patient-medical-profile/route";

vi.mock("@/db", async () => {
  const { memoryDb } = await import("@/test/memory-db");
  return { db: memoryDb };
});

vi.mock("@/lib/auth/guards", async () => {
  const { sessionState } = await import("@/test/memory-db");
  const { UnauthorizedError, ForbiddenError } = await import("@/lib/errors");
  return {
    ROLE_LEVELS: { PATIENT: 1, DOCTOR: 2, ADMIN: 3 },
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
    requireAtLeastRole: async () => {
      if (!sessionState.value) throw new UnauthorizedError();
      return sessionState.value;
    },
  };
});
vi.mock("@/lib/auth/notifications", () => ({ recordAuditEvent: vi.fn() }));

import { resetMemoryDb, seedUser, seedProfile, setSession } from "@/test/memory-db";

const data = {
  allergies: [{ name: "Penicillin", severity: "severe" }],
  conditions: null,
  medications: [],
  surgeries: null,
  familyHistory: null,
  socialHistory: { smoking: "Non-smoker" },
};

function getReq(userId?: string): NextRequest {
  const url = userId
    ? `http://localhost/patient-medical-profile?userId=${userId}`
    : "http://localhost/patient-medical-profile";
  return new NextRequest(url);
}

beforeEach(() => resetMemoryDb());

describe("GET /api/v1/patient-medical-profile", () => {
  it("returns 401 without a session", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it("returns 200 with the patient's own profile", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", data);
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const body = await GET(getReq()).then((r) => r.json());
    expect(body.success).toBe(true);
    expect(body.data.allergies[0].name).toBe("Penicillin");
    expect(body.data.medications).toEqual([]);
    expect(body.data.socialHistory).toEqual({ smoking: "Non-smoker" });
  });

  it("returns data:null when profile does not exist", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const body = await GET(getReq()).then((r) => r.json());
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it("forbids a patient viewing another user's profile", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedUser({ id: "u2", role: Role.PATIENT });
    seedProfile("u2", data);
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await GET(getReq("u2"));
    expect(res.status).toBe(403);
  });

  it("lets a patient view their own profile via ?userId", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", data);
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const body = await GET(getReq("u1")).then((r) => r.json());
    expect(body.success).toBe(true);
    expect(body.data.allergies).toHaveLength(1);
  });

  it("lets a doctor view a patient's profile via ?userId", async () => {
    seedUser({ id: "d1", role: Role.DOCTOR });
    seedUser({ id: "u2", role: Role.PATIENT });
    seedProfile("u2", data);
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });

    const body = await GET(getReq("u2")).then((r) => r.json());
    expect(body.success).toBe(true);
    expect(body.data.allergies[0].name).toBe("Penicillin");
  });

  it("returns 404 for a nonexistent ?userId", async () => {
    seedUser({ id: "d1", role: Role.DOCTOR });
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });

    const body = await GET(getReq("nope")).then((r) => r.json());
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});