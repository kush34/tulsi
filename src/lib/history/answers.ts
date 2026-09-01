import { Prisma, HistoryAnswerInputType } from "@prisma/client";
import { db } from "@/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logging";
import { createAIProvider, applyExtractionSafety } from "@/lib/ai";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { getSection } from "./sections";
import type { HistoryFramework } from "./sections";
import { isWritable } from "./state";
import { getSessionForActor, factsMapFromRows, assembleSessionPayload } from "./session-state";
import type { Actor } from "./session-state";
import { evaluateContradictions } from "./rules/contradictions";
import { evaluateRedFlags } from "./rules/red-flags";
import { chooseNextQuestion } from "./next-question";

const log = createLogger("history-answers");

export interface AnswerInput {
  questionId: string;
  answer: string;
  inputType?: string;
}

function buildFactsSummary(facts: { section: string; field: string; value: Prisma.JsonValue }[]): string {
  return facts
    .map((f) => `${f.field}: ${typeof f.value === "string" ? f.value : JSON.stringify(f.value)}`)
    .join(", ");
}

async function persistExtractedFacts(
  sessionId: string,
  section: string,
  acceptedFacts: { field: string; value: string; confidence?: number }[],
  answerId: string
): Promise<void> {
  for (const fact of acceptedFacts) {
    const data = {
      value: { text: fact.value },
      confidence: fact.confidence ?? null,
      sourceReference: answerId,
      source: "AI_EXTRACTION" as const,
    };
    const existing = await db.historyFact.findFirst({
      where: { sessionId, section, field: fact.field },
    });
    if (existing) {
      await db.historyFact.update({ where: { id: existing.id }, data });
    } else {
      await db.historyFact.create({ data: { sessionId, section, field: fact.field, ...data } });
    }
  }
}

async function detectContradictions(
  sessionId: string,
  section: string,
  acceptedFacts: { field: string; value: string }[],
  priorFacts: { section: string; field: string; value: Prisma.JsonValue }[]
): Promise<void> {
  const newMap = factsMapFromRows(
    acceptedFacts.map((f) => ({ section, field: f.field, value: f.value as Prisma.JsonValue }))
  );
  const existingMap = factsMapFromRows(priorFacts);
  const candidates = evaluateContradictions(newMap, existingMap);

  const openFlags = await db.historyFlag.findMany({
    where: { sessionId, type: "CONTRADICTION", status: "OPEN" },
    select: { id: true, details: true },
  });
  const knownRules = new Set(
    openFlags.map((f) => (f.details as { ruleId?: string } | null)?.ruleId).filter(Boolean)
  );

  for (const candidate of candidates) {
    if (knownRules.has(candidate.ruleId)) continue;
    await db.historyFlag.create({
      data: {
        sessionId,
        status: "OPEN",
        type: "CONTRADICTION",
        description: candidate.description,
        details: { ruleId: candidate.ruleId, fields: candidate.conflictingFields },
      },
    });
  }
}

async function detectRedFlags(sessionId: string, actorId: string, ip?: string): Promise<void> {
  const facts = await db.historyFact.findMany({ where: { sessionId } });
  const candidates = evaluateRedFlags(facts);
  if (candidates.length === 0) return;

  const openFlags = await db.historyFlag.findMany({
    where: { sessionId, type: "RED_FLAG", status: "OPEN" },
    select: { id: true, details: true },
  });
  const knownRules = new Set(
    openFlags.map((f) => (f.details as { ruleId?: string } | null)?.ruleId).filter(Boolean)
  );

  for (const candidate of candidates) {
    if (knownRules.has(candidate.ruleId)) continue;
    await db.historyFlag.create({
      data: {
        sessionId,
        status: "OPEN",
        type: "RED_FLAG",
        severity: candidate.severity,
        description: candidate.alert,
        details: { ruleId: candidate.ruleId, rule: candidate.name, escalation: candidate.escalation },
      },
    });
    await recordAuditEvent({
      userId: actorId,
      event: "HISTORY.RED_FLAG",
      metadata: { sessionId, ruleId: candidate.ruleId, severity: candidate.severity },
      ip,
    });
  }
}

async function persistNextQuestion(
  sessionId: string,
  section: string,
  provider: ReturnType<typeof createAIProvider>
) {
  const session = await db.historySession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundError("History session");

  const askedQuestions = await db.historyQuestion.findMany({
    where: { sessionId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  const askedCount = askedQuestions.length;
  const facts = await db.historyFact.findMany({ where: { sessionId, section } });
  const recentAnswers = await db.historyAnswer.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { rawAnswer: true, question: { select: { question: true } } },
  });

  const result = await chooseNextQuestion(provider, {
    section,
    framework: (session.framework ?? "MODERN") as HistoryFramework,
    askedCount,
    factsSummary: buildFactsSummary(facts),
    missingInfo: [],
    recentAnswers: recentAnswers.reverse().map((r) => ({ question: r.question.question, answer: r.rawAnswer })),
  });

  const nextSequence = askedQuestions[0]?.sequence ?? 0;

  if (result.movedToSection) {
    const question = await db.historyQuestion.create({
      data: {
        sessionId,
        section: result.movedToSection,
        question: result.question ?? "",
        questionType: "OPEN_ENDED",
        sequence: nextSequence + 1,
      },
    });
    await db.historySession.update({
      where: { id: sessionId },
      data: { currentSection: result.movedToSection, currentQuestionId: question.id },
    });
    return question;
  }

  if (result.question) {
    const question = await db.historyQuestion.create({
      data: {
        sessionId,
        section,
        question: result.question,
        questionType: "DYNAMIC",
        sequence: nextSequence + 1,
      },
    });
    await db.historySession.update({ where: { id: sessionId }, data: { currentQuestionId: question.id } });
    return question;
  }

  await db.historySession.update({ where: { id: sessionId }, data: { currentQuestionId: null } });
  return null;
}

export async function answerHistorySession(
  actor: Actor,
  sessionId: string,
  input: AnswerInput,
  ip?: string
) {
  const session = await getSessionForActor(sessionId, actor);
  if (!isWritable(session.status)) {
    throw new ConflictError("This history session is not accepting answers");
  }

  const question = await db.historyQuestion.findFirst({
    where: { id: input.questionId, sessionId: session.id },
  });
  if (!question) throw new NotFoundError("History question for this session");

  const duplicate = await db.historyAnswer.findFirst({
    where: { sessionId: session.id, questionId: input.questionId },
    select: { id: true },
  });
  if (duplicate) throw new ConflictError("This question has already been answered");

  const saved = await db.historyAnswer.create({
    data: {
      sessionId: session.id,
      questionId: question.id,
      rawAnswer: input.answer,
      inputType: (input.inputType as HistoryAnswerInputType) ?? "TEXT",
    },
  });

  if (session.status === "PAUSED") {
    await db.historySession.update({ where: { id: session.id }, data: { status: "IN_PROGRESS" } });
  }

  const section = getSection(question.section);
  const priorFacts = await db.historyFact.findMany({
    where: { sessionId: session.id, section: question.section },
  });

  const provider = createAIProvider();
  let acceptedFacts: { field: string; value: string; confidence?: number }[] = [];
  let blockedSafety = false;

  if (provider && section) {
    try {
      const extraction = await provider.extractClinicalData({
        sectionLabel: section.label,
        question: question.question,
        answer: input.answer,
        allowedFields: section.allowedFields,
      });
      if (extraction.facts.length > 0) {
        const safe = applyExtractionSafety(question.section, new Set(section.allowedFields), extraction);
        blockedSafety = safe.safetyViolations.length > 0;
        acceptedFacts = safe.acceptedFacts;
        if (blockedSafety) {
          await recordAuditEvent({
            userId: actor.id,
            event: "HISTORY.AI_SAFETY_VIOLATION",
            metadata: { sessionId: session.id, violations: safe.safetyViolations },
            ip,
          });
        }
      }
    } catch (error) {
      log.warn({ err: error, sessionId: session.id }, "Clinical extraction failed, keeping raw answer only");
    }
  }

  if (acceptedFacts.length > 0) {
    await persistExtractedFacts(session.id, question.section, acceptedFacts, saved.id);
    await db.historyAnswer.update({
      where: { id: saved.id },
      data: { normalizedAnswer: { facts: acceptedFacts } as Prisma.InputJsonValue },
    });
    await detectContradictions(session.id, question.section, acceptedFacts, priorFacts);
  }

  await detectRedFlags(session.id, actor.id, ip);
  await persistNextQuestion(session.id, question.section, provider);

  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.ANSWER_SUBMITTED",
    metadata: {
      sessionId: session.id,
      questionId: question.id,
      structured: acceptedFacts.length > 0,
      safetyBlocked: blockedSafety,
    },
    ip,
  });

  return assembleSessionPayload(session.id);
}