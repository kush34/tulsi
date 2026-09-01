import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { PUT } from "@/app/api/v1/patient-medical-profile/route";

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

import { resetMemoryDb, seedUser, seedProfile, setSession, getProfile, getChanges } from "@/test/memory-db";
import { recordAuditEvent } from "@/lib/auth/notifications";

function putReq(payload: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/patient-medical-profile", {
    method: "PUT",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

const penicillin = { name: "Penicillin", severity: "severe" };
const peanuts = { name: "Peanuts", severity: "moderate" };

beforeEach(() => {
  resetMemoryDb();
  vi.mocked(recordAuditEvent).mockClear();
});

describe("PUT /api/v1/patient-medical-profile", () => {
  it("returns 401 without a session", async () => {
    const res = await PUT(putReq({}));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a doctor", async () => {
    await setSession({ user: { id: "d1", role: Role.DOCTOR } });
    const res = await PUT(putReq({}));
    expect(res.status).toBe(403);
  });

  it("creates a profile, logs a created change and an audit event", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await PUT(putReq({ allergies: [penicillin] }));
    expect(res.status).toBe(200);

    const stored = getProfile("u1");
    expect(stored?.allergies).toEqual([penicillin]);

    const rows = getChanges();
    expect(rows).toHaveLength(1);
    expect(rows[0].changes).toEqual({ created: true });
    expect(rows[0].changedBy).toBe("u1");
    expect(vi.mocked(recordAuditEvent)).toHaveBeenCalledWith(
      expect.objectContaining({ event: "MEDICAL_PROFILE.UPDATED" })
    );
  });

  it("records client IP on the change row", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    await PUT(putReq({ allergies: [penicillin] }, { "x-forwarded-for": "1.2.3.4" }));
    expect(getChanges()[0].ip).toBe("1.2.3.4");
  });

  it("keeps unprovided fields intact on partial update (regression)", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", { allergies: [penicillin, peanuts], socialHistory: { smoking: "Non-smoker" } });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await PUT(putReq({ socialHistory: { smoking: "Smoker" } }));
    expect(res.status).toBe(200);

    expect(getProfile("u1")?.allergies).toEqual([penicillin, peanuts]);
    expect(getProfile("u1")?.socialHistory).toEqual({ smoking: "Smoker" });

    const rows = getChanges();
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0].changes as Record<string, unknown>)).toEqual(["socialHistory"]);
    expect((rows[0].changes as { socialHistory: unknown }).socialHistory).toEqual({
      from: { smoking: "Non-smoker" },
      to: { smoking: "Smoker" },
    });
  });

  it("tracks a value change", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", { allergies: [penicillin] });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    await PUT(putReq({ allergies: [peanuts] }));

    const row = getChanges()[0];
    expect(Object.keys(row.changes as Record<string, unknown>)).toEqual(["allergies"]);
    expect((row.changes as { allergies: unknown }).allergies).toEqual({
      from: [penicillin],
      to: [peanuts],
    });
  });

  it("writes no change row for an identical payload but still audits", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", { socialHistory: { smoking: "Non-smoker" } });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await PUT(putReq({ socialHistory: { smoking: "Non-smoker" } }));
    expect(res.status).toBe(200);
    expect(getChanges()).toHaveLength(0);
    expect(vi.mocked(recordAuditEvent)).toHaveBeenCalledTimes(1);
  });

  it("tracks explicit null as a clear", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", { allergies: [penicillin], socialHistory: { smoking: "Non-smoker" } });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    await PUT(putReq({ allergies: null }));

    expect(getProfile("u1")?.allergies).toBeNull();
    const row = getChanges()[0];
    expect(Object.keys(row.changes as Record<string, unknown>)).toEqual(["allergies"]);
    expect((row.changes as { allergies: unknown }).allergies).toEqual({ from: [penicillin], to: null });
  });

  it("returns 422 for an invalid payload", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const res = await PUT(putReq({ allergies: [{ severity: "severe" }] }));
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.errors["allergies.0.name"]).toBeDefined();
    expect(getChanges()).toHaveLength(0);
  });

  it("treats a malformed JSON body as a no-op", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedProfile("u1", { socialHistory: { smoking: "Non-smoker" } });
    await setSession({ user: { id: "u1", role: Role.PATIENT } });

    const req = new NextRequest("http://localhost/patient-medical-profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(getChanges()).toHaveLength(0);
  });
});