import { Prisma } from "@prisma/client";
import { db } from "@/db";
import { createLogger } from "@/lib/logging";
import { createAIProvider } from "@/lib/ai";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { getSection } from "./sections";
import type { Actor } from "./session-state";

const log = createLogger("history-snapshot");

export type SnapshotFactEntry = {
  field: string;
  value: string;
  source: string;
  verification: string;
};

export type SnapshotSections = Record<string, SnapshotFactEntry[]>;

function factText(value: Prisma.JsonValue): string {
  if (typeof value === "string") return value;
  return (value as { text?: string } | null)?.text ?? "";
}

export function buildSectionsFromFacts(facts: { section: string; field: string; value: Prisma.JsonValue; source: string; verification: string }[]): SnapshotSections {
  const sections: SnapshotSections = {};
  for (const fact of facts) {
    sections[fact.section] ??= [];
    sections[fact.section].push({
      field: fact.field,
      value: factText(fact.value),
      source: fact.source,
      verification: fact.verification,
    });
  }
  return sections;
}

export function buildFallbackSummary(sections: SnapshotSections, redFlagAlerts: string[]): string {
  const lines: string[] = [];
  for (const [sectionId, facts] of Object.entries(sections)) {
    if (!facts.length) continue;
    const label = getSection(sectionId)?.label ?? sectionId;
    lines.push(`${label}: ${facts.map((f) => `${f.field} — ${f.value}`).join("; ")}`);
  }
  lines.push("This summary is an AI-generated DRAFT and has not been reviewed by a clinician.");
  if (redFlagAlerts.length) {
    lines.push("Important: the following were flagged for human review — " + redFlagAlerts.join("; "));
  }
  return lines.join("\n");
}

export async function materializeSnapshot(
  sessionId: string,
  actor: Actor,
  ip?: string,
  options: { verified?: boolean } = {}
) {
  const facts = await db.historyFact.findMany({ where: { sessionId } });
  const sections = buildSectionsFromFacts(facts);

  const flagRows = await db.historyFlag.findMany({
    where: { sessionId, status: "OPEN" },
    select: { id: true, type: true, description: true },
  });
  const redFlagAlerts = flagRows.filter((f) => f.type === "RED_FLAG").map((f) => f.description);

  const provider = createAIProvider();
  let summary = buildFallbackSummary(sections, redFlagAlerts);
  if (provider) {
    try {
      const sectionsText = Object.entries(sections)
        .map(([id, factsList]) => `${id}: ${factsList.map((f) => `${f.field} ${f.value}`).join(", ")}`)
        .join("\n");
      const result = await provider.generateSummary({ sectionsText, redFlags: redFlagAlerts });
      summary = result.summary;
    } catch (error) {
      log.warn({ err: error, sessionId }, "AI summary failed, using fallback");
    }
  }

  const snapshot = await db.clinicalHistory.findUnique({ where: { sessionId } });
  const verified = options.verified ?? snapshot?.isVerified ?? false;

  const result = await db.clinicalHistory.upsert({
    where: { sessionId },
    create: {
      sessionId,
      sections: sections as unknown as Prisma.InputJsonValue,
      summary,
      isVerified: verified,
    },
    update: {
      sections: sections as unknown as Prisma.InputJsonValue,
      summary,
      isVerified: verified,
    },
  });
  await recordAuditEvent({
    userId: actor.id,
    event: "HISTORY.SNAPSHOT_GENERATED",
    metadata: { sessionId, openRedFlags: redFlagAlerts.length, verified },
    ip,
  });
  return result;
}