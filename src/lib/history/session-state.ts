import { Prisma, Role } from "@prisma/client";
import { db } from "@/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getSection } from "./sections";
import { getMissingFields } from "./rules/missing-info";

export interface Actor {
  id: string;
  role: Role;
}

export async function getSessionForActor(sessionId: string, actor: Actor) {
  const session = await db.historySession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundError("History session");
  if (actor.role === Role.PATIENT && session.patientId !== actor.id) {
    throw new ForbiddenError("You do not have access to this session");
  }
  return session;
}

export function factsMapFromRows(
  rows: { section: string; field: string; value: Prisma.JsonValue }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    if (typeof row.value !== "string") continue;
    const key = `${row.section}:${row.field}`;
    const values = map.get(key) ?? [];
    values.push(row.value);
    map.set(key, values);
  }
  return map;
}

function groupSections(
  facts: { section: string; field: string; value: Prisma.JsonValue }[]
): Record<string, Record<string, Prisma.JsonValue[]>> {
  const sections: Record<string, Record<string, Prisma.JsonValue[]>> = {};
  for (const fact of facts) {
    sections[fact.section] ??= {};
    sections[fact.section][fact.field] ??= [];
    sections[fact.section][fact.field].push(fact.value);
  }
  return sections;
}

export interface SessionPayload {
  session: {
    id: string;
    status: string;
    framework: string;
    currentSection: string;
    startedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  currentQuestion: { id: string; question: string; section: string; questionType: string; sequence: number } | null;
  questionCount: number;
  answerCount: number;
  missingInfo: string[];
  reviewReady: boolean;
  facts: Record<string, Record<string, Prisma.JsonValue[]>>;
  flags: {
    redFlags: unknown[];
    contradictions: unknown[];
  };
}

export async function assembleSessionPayload(sessionId: string): Promise<SessionPayload> {
  const [session, questions, answers, facts, flags] = await Promise.all([
    db.historySession.findUnique({ where: { id: sessionId } }),
    db.historyQuestion.findMany({
      where: { sessionId },
      orderBy: { sequence: "asc" },
      select: { id: true, question: true, section: true, questionType: true, sequence: true },
    }),
    db.historyAnswer.findMany({ where: { sessionId }, select: { id: true } }),
    db.historyFact.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } }),
    db.historyFlag.findMany({ where: { sessionId }, orderBy: { detectedAt: "desc" } }),
  ]);

  if (!session) throw new NotFoundError("History session");

  const currentQuestion =
    session.currentQuestionId
      ? questions.find((q) => q.id === session.currentQuestionId) ?? null
      : null;

  const section = getSection(session.currentSection);
  const sectionFacts = facts.filter((f) => f.section === session.currentSection);
  const presentFields = new Set<string>();
  for (const fact of sectionFacts) {
    if (typeof fact.value === "string") presentFields.add(fact.field);
  }
  const missingInfo = section ? getMissingFields(section.requiredFields, presentFields) : [];

  return {
    session: {
      id: session.id,
      status: session.status,
      framework: session.framework,
      currentSection: session.currentSection,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    currentQuestion,
    questionCount: questions.length,
    answerCount: answers.length,
    missingInfo,
    reviewReady: !currentQuestion && session.currentSection === "PREVIOUS_INVESTIGATIONS",
    facts: groupSections(facts),
    flags: {
      redFlags: flags.filter((f) => f.type === "RED_FLAG"),
      contradictions: flags.filter((f) => f.type === "CONTRADICTION"),
    },
  };
}