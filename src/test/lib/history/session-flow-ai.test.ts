import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import type { AIProvider } from "@/lib/ai/provider";
import { getHistoryFacts, getHistoryFlags, resetMemoryDb, seedUser } from "@/test/memory-db";

vi.mock("@/db", async () => {
  const { memoryDb, memoryDbHistory } = await import("@/test/memory-db");
  return { db: { ...memoryDb, ...memoryDbHistory } };
});
vi.mock("@/lib/auth/notifications", () => ({ recordAuditEvent: vi.fn() }));
vi.mock("@/lib/ai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai")>("@/lib/ai");
  return { ...actual, createAIProvider: vi.fn() };
});

import { recordAuditEvent } from "@/lib/auth/notifications";
import { createAIProvider } from "@/lib/ai";
import {
  createHistorySession,
  answerHistorySession,
  requestPatientReview,
  getClinicalSummary,
} from "@/lib/history";

describe("history session flow (AI provider present)", () => {
  beforeEach(() => {
    resetMemoryDb();
    vi.mocked(recordAuditEvent).mockClear();
    vi.mocked(createAIProvider).mockReturnValue(null);
  });

  function stubProvider(): AIProvider {
    return {
      generateQuestion: async () => ({ question: "Tell me more about the symptoms.", sectionComplete: false }),
      extractClinicalData: async () => ({
        facts: [{ field: "complaint", value: "chest pain with difficulty breathing" }],
        diagnosesProposed: [],
        prescriptionsProposed: [],
      }),
      generateSummary: async () => ({ summary: "AI-generated clinical summary (draft)." }),
    };
  }

  it("stores extracted facts and raises a red flag when symptoms warrant it", async () => {
    vi.mocked(createAIProvider).mockReturnValue(stubProvider());
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };

    const created = await createHistorySession(actor, {});
    const payload = await answerHistorySession(actor, created.session.id, {
      questionId: created.currentQuestion.id,
      answer: "chest pain with difficulty breathing",
    });

    const facts = getHistoryFacts();
    expect(facts.map((f) => f.field)).toEqual(expect.arrayContaining(["complaint"]));
    expect((facts[0].value as { text: string }).text).toBe("chest pain with difficulty breathing");

    const flags = getHistoryFlags().filter((f) => f.type === "RED_FLAG");
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("POTENTIAL_EMERGENCY");
    expect((flags[0].details as { ruleId: string }).ruleId).toBe("CHEST_PAIN_EMERGENCY");
    expect(vi.mocked(recordAuditEvent)).toHaveBeenCalledWith(expect.objectContaining({ event: "HISTORY.RED_FLAG" }));

    expect(payload.facts["CHIEF_COMPLAINT"]?.complaint).toBeDefined();
  });

  it("does not raise a duplicate red flag on a later answer", async () => {
    vi.mocked(createAIProvider).mockReturnValue(stubProvider());
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };

    const created = await createHistorySession(actor, {});
    await answerHistorySession(actor, created.session.id, {
      questionId: created.currentQuestion.id,
      answer: "chest pain with difficulty breathing",
    });

    const next = await (await import("@/lib/history")).getHistorySessionPayload(created.session.id, actor);
    await answerHistorySession(actor, created.session.id, {
      questionId: next.currentQuestion!.id,
      answer: "it started yesterday",
    });

    expect(getHistoryFlags().filter((f) => f.type === "RED_FLAG")).toHaveLength(1);
  });

  it("blocks the extraction when the model proposes a diagnosis and logs a safety audit event", async () => {
    vi.mocked(createAIProvider).mockReturnValue({
      ...stubProvider(),
      extractClinicalData: async () => ({
        facts: [{ field: "complaint", value: "fever" }],
        diagnosesProposed: ["viral fever"],
        prescriptionsProposed: [],
      }),
    });
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };

    const created = await createHistorySession(actor, {});
    await answerHistorySession(actor, created.session.id, {
      questionId: created.currentQuestion.id,
      answer: "felt feverish since yesterday",
    });

    expect(getHistoryFacts()).toEqual([]);
    expect(vi.mocked(recordAuditEvent)).toHaveBeenCalledWith(
      expect.objectContaining({ event: "HISTORY.AI_SAFETY_VIOLATION" })
    );
  });

  it("uses the AI summary when generating the clinical snapshot", async () => {
    vi.mocked(createAIProvider).mockReturnValue(stubProvider());
    seedUser({ id: "u1", role: Role.PATIENT });
    const actor = { id: "u1", role: Role.PATIENT };

    const created = await createHistorySession(actor, {});
    await answerHistorySession(actor, created.session.id, {
      questionId: created.currentQuestion.id,
      answer: "chest pain with difficulty breathing",
    });

    await requestPatientReview(created.session.id, actor);
    const snapshot = await getClinicalSummary(created.session.id, actor);
    expect(snapshot.summary).toBe("AI-generated clinical summary (draft).");
  });
});