import { Role } from "@prisma/client";
import { db } from "@/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { getSection } from "./sections";
import { assertTransition } from "./state";
import { getSessionForActor, assembleSessionPayload } from "./session-state";
import type { Actor } from "./session-state";
import { materializeSnapshot } from "./snapshot";

export interface CreateSessionInput {
  appointmentId?: string | null;
  framework?: "MODERN" | "AYUSH";
}

function firstChiefComplaintQuestion() {
  const section = getSection("CHIEF_COMPLAINT");
  return { question: section?.fallbackQuestions[0] ?? "Please describe your main health concern.", section };
}

export async function createHistorySession(
  actor: Actor,
  input: CreateSessionInput,
  ip?: string
) {
  const active = await db.historySession.findFirst({
    where: {
      patientId: actor.id,
      status: { in: ["IN_PROGRESS", "PAUSED", "PATIENT_REVIEW", "DOCTOR_REVIEW"] },
    },
    select: { id: true, status: true },
  });
  if (active) {
    throw new ConflictError("An active history session already exists for this patient");
  }

  const opener = firstChiefComplaintQuestion();
  const framework = input.framework ?? "MODERN";

  const [session] = await db.$transaction([
    db.historySession.create({
      data: {
        patientId: actor.id,
        appointmentId: input.appointmentId ?? null,
        framework,
        status: "IN_PROGRESS",
        currentSection: "CHIEF_COMPLAINT",
      },
    }),
  ]);

  const question = await db.historyQuestion.create({
    data: {
      sessionId: session.id,
      section: "CHIEF_COMPLAINT",
      question: opener.question,
      questionType: "OPEN_ENDED",
      sequence: 1,
    },
  });

  const updated = await db.historySession.update({
    where: { id: session.id },
    data: { currentQuestionId: question.id },
  });

  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.SESSION_STARTED",
    metadata: { sessionId: session.id, framework },
    ip,
  });

  return { session: updated, currentQuestion: question };
}

export async function pauseHistorySession(sessionId: string, actor: Actor) {
  const session = await getSessionForActor(sessionId, actor);
  assertTransition(session.status, "PAUSED");
  const updated = await db.historySession.update({
    where: { id: session.id },
    data: { status: "PAUSED" },
  });
  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.SESSION_PAUSED",
    metadata: { sessionId: session.id },
  });
  return updated;
}

export async function resumeHistorySession(sessionId: string, actor: Actor) {
  const session = await getSessionForActor(sessionId, actor);
  assertTransition(session.status, "IN_PROGRESS");
  const updated = await db.historySession.update({
    where: { id: session.id },
    data: { status: "IN_PROGRESS" },
  });
  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.SESSION_RESUMED",
    metadata: { sessionId: session.id },
  });
  return updated;
}

export async function requestPatientReview(sessionId: string, actor: Actor, ip?: string) {
  let session = await getSessionForActor(sessionId, actor);
  if (session.status === "PAUSED") {
    session = await db.historySession.update({
      where: { id: session.id },
      data: { status: "IN_PROGRESS" },
    });
  }
  assertTransition(session.status, "PATIENT_REVIEW");

  const snapshot = await materializeSnapshot(sessionId, actor, ip);

  await db.historySession.update({
    where: { id: sessionId },
    data: { status: "PATIENT_REVIEW" },
  });
  void session;

  return { snapshot, status: "PATIENT_REVIEW" };
}

export async function getClinicalSummary(sessionId: string, actor: Actor) {
  await getSessionForActor(sessionId, actor);
  const snapshot = await db.clinicalHistory.findUnique({ where: { sessionId } });
  if (!snapshot) throw new NotFoundError("Clinical summary");
  return snapshot;
}

export async function getDraftHistory(sessionId: string, actor: Actor) {
  const session = await getSessionForActor(sessionId, actor);
  const [facts, flags] = await Promise.all([
    db.historyFact.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } }),
    db.historyFlag.findMany({ where: { sessionId }, orderBy: { detectedAt: "desc" } }),
  ]);
  const sections: Record<string, Record<string, unknown>> = {};
  for (const fact of facts) {
    sections[fact.section] ??= {};
    sections[fact.section][fact.field] ??= [];
    (sections[fact.section][fact.field] as unknown[]).push(fact.value);
  }
  return {
    sessionId,
    status: session.status,
    sections,
    redFlags: flags.filter((f) => f.type === "RED_FLAG"),
    contradictions: flags.filter((f) => f.type === "CONTRADICTION"),
  };
}

export async function listHistorySessions(
  actor: Actor,
  page: number,
  limit: number,
  status?: string
) {
  const where: Record<string, unknown> = {};
  if (actor.role === Role.PATIENT) {
    where.patientId = actor.id;
  }
  if (status) where.status = status;

  const [sessions, total] = await Promise.all([
    db.historySession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        framework: true,
        currentSection: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        _count: { select: { answers: true, facts: true, flags: true } },
      },
    }),
    db.historySession.count({ where }),
  ]);
  return {
    data: sessions.map((s) => ({ ...s, counts: s._count })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getHistorySessionPayload(sessionId: string, actor: Actor) {
  await getSessionForActor(sessionId, actor);
  return assembleSessionPayload(sessionId);
}