import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/v1/patient-medical-profile/history/route";

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

import { resetMemoryDb, memoryDb, seedUser, seedProfile, setSession } from "@/test/memory-db";

function getReq(userId?: string): NextRequest {
  const url = userId
    ? `http://localhost/patient-medical-profile/history?userId=${userId}`
    : "http://localhost/patient-medical-profile/history";
  return new NextRequest(url);
}

async function seedChange(profileId: string, changes: Record<string, unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 2));
  await memoryDb.medicalProfileChange.create({
    data: { profileId, changedBy: "u1", changes, ip: "9.9.9.9" },
  });
}

const data = { allergies: [{ name: "Penicillin" }] };

beforeEach(() => resetMemoryDb());

describe("GET /api/v1/patient-medical-profile/history", () => {
  it("returns 401 without a session", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it("returns the patient's change history in descending order", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", data);
    await seedChange("profile-u1", { allergies: { from: null, to: data.allergies } });
    await seedChange("profile-u1", { socialHistory: { from: null, to: { smoking: "Smoker" } } });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await GET(getReq());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].changes).toEqual({ socialHistory: { from: null, to: { smoking: "Smoker" } } });
    expect(body.data[0].changedBy).toBe("u1");
    expect(body.data[0].ip).toBe("9.9.9.9");
    expect(typeof body.data[1].createdAt).toBe("string");
  });

  it("returns 404 when the profile does not exist", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const body = await GET(getReq()).then((r) => r.json());
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("forbids a patient viewing another user's history", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedUser({ id: "u2", role: Role.PATIENT });
    seedProfile("u2", data);
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await GET(getReq("u2"));
    expect(res.status).toBe(403);
  });

  it("lets a doctor view a patient's history via ?userId", async () => {
    seedUser({ id: "d1", role: Role.DOCTOR });
    seedUser({ id: "u2", role: Role.PATIENT });
    seedProfile("u2", data);
    await seedChange("profile-u2", { allergies: { from: null, to: null } });
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });

    const body = await GET(getReq("u2")).then((r) => r.json());
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].profileId).toBeUndefined();
  });

  it("returns 404 for a nonexistent ?userId", async () => {
    seedUser({ id: "d1", role: Role.DOCTOR });
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });

    const res = await GET(getReq("nope"));
    expect(res.status).toBe(404);
  });

  it("limits history to 50 newest-first entries", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", data);
    for (let i = 0; i < 60; i += 1) {
      await seedChange("profile-u1", { n: i });
    }
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const body = await GET(getReq()).then((r) => r.json());
    expect(body.data).toHaveLength(50);
    expect((body.data[0].changes as { n: number }).n).toBe(59);
    expect((body.data[49].changes as { n: number }).n).toBe(10);
  });
});