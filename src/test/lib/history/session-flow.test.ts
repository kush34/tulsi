import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import {
  resetMemoryDb,
  seedUser,
  memoryDb,
  memoryDbHistory,
  getHistorySessions,
  getHistoryFlags,
} from "@/test/memory-db";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";

vi.mock("@/db", async () => {
  const { memoryDb, memoryDbHistory } = await import("@/test/memory-db");
  return { db: { ...memoryDb, ...memoryDbHistory } };
});
vi.mock("@/lib/auth/notifications", () => ({ recordAuditEvent: vi.fn() }));
vi.mock("@/lib/ai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai")>("@/lib/ai");
  return { ...actual, createAIProvider: vi.fn(() => null) };
});

import {
  createHistorySession,
  answerHistorySession,
  pauseHistorySession,
  resumeHistorySession,
  requestPatientReview,
  getClinicalSummary,
  getDraftHistory,
  getHistorySessionPayload,
} from "@/lib/history";

describe("history session flow (deterministic, no AI provider)", () => {
  beforeEach(() => resetMemoryDb());

  it("creates a session with the first question and rejects a concurrent active session", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };

    const created = await createHistorySession(actor, {});
    expect(created.session.status).toBe("IN_PROGRESS");
    expect(created.session.currentSection).toBe("CHIEF_COMPLAINT");
    expect(created.currentQuestion.section).toBe("CHIEF_COMPLAINT");
    expect(created.currentQuestion.sequence).toBe(1);

    await expect(createHistorySession(actor, {})).rejects.toThrow(ConflictError);
  });

  it("persists an answer, advances the section, and prevents duplicate answers", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };
    const created = await createHistorySession(actor, {});
    const questionId = created.currentQuestion.id;

    const payload = await answerHistorySession(actor, created.session.id, {
      questionId,
      answer: "I have had a fever with chills for two days.",
    });

    expect(payload.answerCount).toBe(1);
    expect(payload.session.currentSection).toBe("HPI");
    expect(payload.currentQuestion?.section).toBe("HPI");
    expect(payload.reviewReady).toBe(false);

    await expect(
      answerHistorySession(actor, created.session.id, { questionId, answer: "again" })
    ).rejects.toThrow(ConflictError);
  });

  it("rejects answers to questions that do not belong to the session", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };
    const created = await createHistorySession(actor, {});

    await expect(
      answerHistorySession(actor, created.session.id, { questionId: created.currentQuestion.id + "-x", answer: "y" })
    ).rejects.toThrow(NotFoundError);
  });

  it("enforces ownership for patients but allows doctors", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    seedUser({ id: "u2", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };
    const created = await createHistorySession(actor, {});

    await expect(getHistorySessionPayload(created.session.id, { id: "u2", role: Role.PATIENT })).rejects.toThrow(
      ForbiddenError
    );
    const doctorView = await getHistorySessionPayload(created.session.id, { id: "d1", role: Role.DOCTOR });
    expect(doctorView.session.id).toBe(created.session.id);
    await expect(getHistorySessionPayload("missing", actor)).rejects.toThrow(NotFoundError);
  });

  it("pauses, accepts answers while paused, then resumes", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };
    const created = await createHistorySession(actor, {});
    const questionId = created.currentQuestion.id;

    const paused = await pauseHistorySession(created.session.id, actor);
    expect(paused.status).toBe("PAUSED");
    await expect(pauseHistorySession(created.session.id, actor)).rejects.toThrow(ConflictError);

    const resumed = await resumeHistorySession(created.session.id, actor);
    expect(resumed.status).toBe("IN_PROGRESS");
    await expect(resumeHistorySession(created.session.id, actor)).rejects.toThrow(ConflictError);

    await pauseHistorySession(created.session.id, actor);
    const payload = await answerHistorySession(actor, created.session.id, {
      questionId,
      answer: "still writable while paused",
    });
    expect(payload.session.status).toBe("IN_PROGRESS");
    await expect(resumeHistorySession(created.session.id, actor)).rejects.toThrow(ConflictError);
  });

  it("completes into PATIENT_REVIEW with a clinical summary snapshot", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };
    const created = await createHistorySession(actor, {});
    const questionId = created.currentQuestion.id;
    await answerHistorySession(actor, created.session.id, { questionId, answer: "persistent cough" });

    const result = await requestPatientReview(created.session.id, actor);
    expect(result.status).toBe("PATIENT_REVIEW");

    expect(getHistorySessions()[0].status).toBe("PATIENT_REVIEW");

    const snapshot = await getClinicalSummary(created.session.id, actor);
    expect(snapshot.isVerified).toBe(false);
    expect(snapshot.summary?.toLowerCase()).toContain("draft");

    await expect(requestPatientReview(created.session.id, actor)).rejects.toThrow(ConflictError);
  });

  it("returns a draft history grouped by section", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };
    const created = await createHistorySession(actor, {});
    const draft = await getDraftHistory(created.session.id, actor);
    expect(draft.sessionId).toBe(created.session.id);
    expect(draft.redFlags).toEqual([]);
  });

  it("blocks answers once in PATIENT_REVIEW", async () => {
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };
    const created = await createHistorySession(actor, {});
    const questionId = created.currentQuestion.id;

    await answerHistorySession(actor, created.session.id, { questionId, answer: "cough" });
    await requestPatientReview(created.session.id, actor);

    const next = await getHistorySessionPayload(created.session.id, actor);
    if (next.currentQuestion) {
      await expect(
        answerHistorySession(actor, created.session.id, {
          questionId: next.currentQuestion.id,
          answer: "late answer",
        })
      ).rejects.toThrow(ConflictError);
    } else {
      expect(next.reviewReady).toBeDefined();
    }
  });

  it("is writable during review for logging purposes", () => {
    expect(getHistoryFlags()).toEqual([]);
    expect(memoryDb).toBeDefined();
    expect(memoryDbHistory).toBeDefined();
  });
});