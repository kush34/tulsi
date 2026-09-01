import { createLogger } from "@/lib/logging";
import type { ClinicalExtractionResult, ExtractedFact } from "./provider";

const log = createLogger("ai-safety");

export interface SafeExtraction {
  acceptedFacts: ExtractedFact[];
  safetyViolations: string[];
}

export function applyExtractionSafety(
  section: string,
  allowedFields: Set<string>,
  extraction: ClinicalExtractionResult
): SafeExtraction {
  const safetyViolations: string[] = [];
  if (extraction.diagnosesProposed.length > 0) {
    safetyViolations.push(`diagnosis: ${extraction.diagnosesProposed.join(", ")}`);
  }
  if (extraction.prescriptionsProposed.length > 0) {
    safetyViolations.push(`prescription: ${extraction.prescriptionsProposed.join(", ")}`);
  }

  if (safetyViolations.length > 0) {
    log.warn(
      { section, safetyViolations },
      "AI safety boundary crossed during clinical extraction — structured output rejected"
    );
    return { acceptedFacts: [], safetyViolations };
  }

  const acceptedFacts = extraction.facts.filter((fact) => {
    const allowed = allowedFields.has(fact.field);
    if (!allowed) {
      log.warn({ section, field: fact.field }, "AI proposed a field outside the section allowlist — dropped");
    }
    return allowed;
  });

  return { acceptedFacts, safetyViolations };
}