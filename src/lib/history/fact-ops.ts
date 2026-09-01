import { Role, Prisma, HistoryFactSource, HistoryFactVerification } from "@prisma/client";
import { db } from "@/db";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { getSection } from "./sections";
import { getSessionForActor } from "./session-state";
import type { Actor } from "./session-state";
import { materializeSnapshot } from "./snapshot";

function requirePhase(session: { status: string }, phase: string): void {
  if (session.status !== phase) {
    throw new ConflictError(`This action requires the session to be in ${phase}`);
  }
}

function requireStaff(actor: Actor): void {
  if (actor.role === Role.PATIENT) {
    throw new ForbiddenError("Only doctors can perform this action");
  }
}

function sourceForRole(role: Role): HistoryFactSource {
  return role === Role.PATIENT ? HistoryFactSource.PATIENT : HistoryFactSource.DOCTOR;
}

function verificationForRole(role: Role): HistoryFactVerification {
  return role === Role.PATIENT
    ? HistoryFactVerification.PATIENT_CONFIRMED
    : HistoryFactVerification.DOCTOR_VERIFIED;
}

export async function addFact(
  actor: Actor,
  sessionId: string,
  input: { section: string; field: string; value: string },
  ip?: string
) {
  const session = await getSessionForActor(sessionId, actor);
  requirePhase(session, actor.role === Role.PATIENT ? "PATIENT_REVIEW" : "DOCTOR_REVIEW");

  const section = getSection(input.section);
  if (!section) throw new NotFoundError("History section");
  if (!section.allowedFields.includes(input.field)) {
    throw new ConflictError(`Field "${input.field}" is not allowed in section "${input.section}"`);
  }

  const existing = await db.historyFact.findFirst({
    where: { sessionId, section: input.section, field: input.field },
  });
  if (existing) {
    throw new ConflictError(`A fact for "${input.field}" already exists; edit it instead`);
  }

  const fact = await db.historyFact.create({
    data: {
      sessionId,
      section: input.section,
      field: input.field,
      value: { text: input.value } as Prisma.InputJsonValue,
      source: sourceForRole(actor.role),
      verification: verificationForRole(actor.role),
      verifiedById: actor.id,
      verifiedAt: new Date(),
    },
  });
  await materializeSnapshot(sessionId, actor, ip);
  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.FACT_ADDED",
    metadata: { sessionId, section: input.section, field: input.field, source: fact.source },
    ip,
  });
  return fact;
}

export async function editFact(
  actor: Actor,
  sessionId: string,
  factId: string,
  value: string,
  ip?: string
) {
  const session = await getSessionForActor(sessionId, actor);
  requirePhase(session, actor.role === Role.PATIENT ? "PATIENT_REVIEW" : "DOCTOR_REVIEW");

  const fact = await db.historyFact.findFirst({ where: { id: factId, sessionId } });
  if (!fact) throw new NotFoundError("History fact");

  const previous = typeof fact.value === "string" ? fact.value : (fact.value as { text?: string }).text;
  const updated = await db.historyFact.update({
    where: { id: fact.id },
    data: {
      value: { text: value } as Prisma.InputJsonValue,
      source: sourceForRole(actor.role),
      verification: verificationForRole(actor.role),
      verifiedById: actor.id,
      verifiedAt: new Date(),
    },
  });
  await materializeSnapshot(sessionId, actor, ip);
  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.FACT_EDITED",
    metadata: { sessionId, factId: fact.id, section: fact.section, field: fact.field, from: previous, to: value },
    ip,
  });
  return updated;
}

export async function verifyFact(actor: Actor, sessionId: string, factId: string, ip?: string) {
  requireStaff(actor);
  const session = await getSessionForActor(sessionId, actor);
  requirePhase(session, "DOCTOR_REVIEW");

  const fact = await db.historyFact.findFirst({ where: { id: factId, sessionId } });
  if (!fact) throw new NotFoundError("History fact");

  const updated = await db.historyFact.update({
    where: { id: fact.id },
    data: { verification: "DOCTOR_VERIFIED", verifiedById: actor.id, verifiedAt: new Date() },
  });
  await materializeSnapshot(sessionId, actor, ip);
  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.FACT_VERIFIED",
    metadata: { sessionId, factId: fact.id, section: fact.section, field: fact.field },
    ip,
  });
  return updated;
}

export async function setFlagStatus(
  actor: Actor,
  sessionId: string,
  flagId: string,
  status: "RESOLVED" | "DISMISSED",
  resolution?: string,
  ip?: string
) {
  requireStaff(actor);
  const session = await getSessionForActor(sessionId, actor);
  requirePhase(session, "DOCTOR_REVIEW");

  const flag = await db.historyFlag.findFirst({ where: { id: flagId, sessionId } });
  if (!flag) throw new NotFoundError("History flag");
  if (flag.status !== "OPEN") throw new ConflictError("This flag has already been actioned");

  const updated = await db.historyFlag.update({
    where: { id: flag.id },
    data: {
      status,
      resolution: resolution ?? null,
      resolvedById: actor.id,
      resolvedAt: new Date(),
    },
  });
  await materializeSnapshot(sessionId, actor, ip);
  await recordAuditEvent({
    userId: actor.id,
    event: status === "RESOLVED" ? "HISTORY.FLAG_RESOLVED" : "HISTORY.FLAG_DISMISSED",
    metadata: { sessionId, flagId: flag.id, type: flag.type, resolution: resolution ?? null },
    ip,
  });
  return updated;
}