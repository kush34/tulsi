import { Role } from "@prisma/client";
import { db } from "@/db";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { getSection } from "./sections";
import { getMissingFields } from "./rules/missing-info";
import { assertTransition } from "./state";
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

export async function getReviewHistory(sessionId: string, actor: Actor) {
  const session = await getSessionForActor(sessionId, actor);
  const [facts, flags, snapshot] = await Promise.all([
    db.historyFact.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } }),
    db.historyFlag.findMany({ where: { sessionId }, orderBy: { detectedAt: "desc" } }),
    db.clinicalHistory.findUnique({ where: { sessionId } }),
  ]);

  const sections: Record<
    string,
    { label: string; facts: unknown[]; missing: string[] }
  > = {};
  for (const fact of facts) {
    sections[fact.section] ??= {
      label: getSection(fact.section)?.label ?? fact.section,
      facts: [],
      missing: [],
    };
    sections[fact.section].facts.push({
      id: fact.id,
      field: fact.field,
      value: typeof fact.value === "string" ? fact.value : (fact.value as { text?: string })?.text ?? "",
      source: fact.source,
      verification: fact.verification,
      verifiedById: fact.verifiedById,
      verifiedAt: fact.verifiedAt,
    });
  }

  for (const [sectionId, section] of Object.entries(sections)) {
    const def = getSection(sectionId);
    if (!def) continue;
    const present = new Set<string>(
      (section.facts as { field: string; value: string }[])
        .filter((f) => f.value.length > 0)
        .map((f) => f.field)
    );
    section.missing = getMissingFields(def.requiredFields, present);
  }

  return {
    sessionId,
    status: session.status,
    framework: session.framework,
    sections,
    redFlags: flags.filter((f) => f.type === "RED_FLAG"),
    contradictions: flags.filter((f) => f.type === "CONTRADICTION"),
    summary: snapshot?.summary ?? null,
    isVerified: snapshot?.isVerified ?? false,
  };
}

export async function confirmHistory(actor: Actor, sessionId: string, ip?: string) {
  if (actor.role !== Role.PATIENT) {
    throw new ForbiddenError("Only the patient can confirm their history");
  }
  const session = await getSessionForActor(sessionId, actor);
  requirePhase(session, "PATIENT_REVIEW");

  const now = new Date();
  const { count } = await db.historyFact.updateMany({
    where: { sessionId, verification: "UNVERIFIED" },
    data: { verification: "PATIENT_CONFIRMED", verifiedById: actor.id, verifiedAt: now },
  });

  assertTransition(session.status, "DOCTOR_REVIEW");
  const updated = await db.historySession.update({
    where: { id: sessionId },
    data: { status: "DOCTOR_REVIEW" },
  });

  const snapshot = await materializeSnapshot(sessionId, actor, ip);
  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.HISTORY_CONFIRMED",
    metadata: { sessionId, confirmedFacts: count },
    ip,
  });

  return { session: updated, snapshot, confirmedFacts: count };
}

export async function finalizeHistory(actor: Actor, sessionId: string, ip?: string) {
  requireStaff(actor);
  const session = await getSessionForActor(sessionId, actor);
  requirePhase(session, "DOCTOR_REVIEW");

  assertTransition(session.status, "COMPLETED");
  const updated = await db.historySession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  const snapshot = await materializeSnapshot(sessionId, actor, ip, { verified: true });
  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.HISTORY_FINALIZED",
    metadata: { sessionId, verified: true },
    ip,
  });

  return { session: updated, snapshot };
}