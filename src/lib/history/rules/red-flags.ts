import { HistoryFactVerification } from "@prisma/client";
import type { HistoryFact } from "@prisma/client";

export interface RedFlagCandidate {
  ruleId: string;
  name: string;
  severity: "POTENTIAL_EMERGENCY" | "CONCERN";
  escalation: "IMMEDIATE_HUMAN_REVIEW" | "ROUTINE_REVIEW";
  alert: string;
  matchedTerms: string[];
}

function hasAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

function countMatches(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t)).length;
}

const SIGNAL_FIELDS = new Set([
  "complaint",
  "associatedSymptoms",
  "symptom",
  "character",
  "location",
  "radiation",
]);

function factText(fact: HistoryFact): string | null {
  if (typeof fact.value === "string") return fact.value;
  if (typeof fact.value === "object" && fact.value !== null && "text" in (fact.value as object)) {
    return (fact.value as { text: string }).text;
  }
  return null;
}

function collectBlobs(facts: HistoryFact[]): string[] {
  return facts
    .filter((f) => f.verification !== HistoryFactVerification.REJECTED)
    .map((f) => ({ field: f.field, text: factText(f) }))
    .filter((entry): entry is { field: string; text: string } => entry.text !== null)
    .filter((entry) => SIGNAL_FIELDS.has(entry.field))
    .map((entry) => entry.text);
}

export function evaluateRedFlags(facts: HistoryFact[]): RedFlagCandidate[] {
  const blobs = collectBlobs(facts);
  if (blobs.length === 0) return [];
  const blob = blobs.join(" | ");

  const candidates: RedFlagCandidate[] = [];

  const strokeMarkers = [
    "face droop",
    "facial droop",
    "facial weakness",
    "face weak",
    "arm weakness",
    "weakness in one arm",
    "numbness in one arm",
    "weakness on one side",
    "numbness on one side",
    "slurred speech",
    "difficulty speaking",
    "trouble speaking",
    "difficulty understanding speech",
  ];
  if (countMatches(blob, strokeMarkers) >= 2) {
    candidates.push({
      ruleId: "STROKE_LIKE",
      name: "Possible stroke symptoms",
      severity: "POTENTIAL_EMERGENCY",
      escalation: "IMMEDIATE_HUMAN_REVIEW",
      alert:
        "Symptoms commonly associated with a possible stroke were noted. This has been flagged for immediate review — please consult a healthcare professional right away. This is not a diagnosis.",
      matchedTerms: strokeMarkers.filter((t) => blob.includes(t)),
    });
  }

  const chestTerms = [
    "chest pain",
    "chest tightness",
    "chest pressure",
    "chest discomfort",
    "crushing chest",
  ];
  const isChest = hasAny(blob, chestTerms);
  const severe = hasAny(blob, [
    "severe",
    "very severe",
    "worst pain",
    "worsening",
  ]);
  const chestCompanions = [
    "shortness of breath",
    "breathless",
    "difficulty breathing",
    "sweating",
    "cold sweat",
    "nausea",
    "dizziness",
  ];
  if (isChest && (severe || countMatches(blob, chestCompanions) >= 1)) {
    candidates.push({
      ruleId: "CHEST_PAIN_EMERGENCY",
      name: "Possible cardiac emergency symptoms",
      severity: "POTENTIAL_EMERGENCY",
      escalation: "IMMEDIATE_HUMAN_REVIEW",
      alert:
        "Symptoms commonly associated with a possible cardiac emergency were noted and flagged for immediate review — please seek urgent medical attention. This is not a diagnosis.",
      matchedTerms: chestTerms.concat(severe ? ["severe"] : [], chestCompanions.filter((t) => blob.includes(t))),
    });
  }

  const swelling = hasAny(blob, [
    "swelling of the tongue",
    "swollen tongue",
    "swelling of the lips",
    "swollen lips",
    "swelling of the throat",
    "swelling in the throat",
    "throat swelling",
  ]);
  const breathing = hasAny(blob, ["difficulty breathing", "shortness of breath", "wheezing"]);
  const rashLike = hasAny(blob, ["hives", "itchy rash", "rash all over"]);
  if ((swelling && breathing) || ((swelling || breathing) && rashLike)) {
    candidates.push({
      ruleId: "ANAPHYLAXIS_LIKE",
      name: "Possible severe allergic reaction",
      severity: "POTENTIAL_EMERGENCY",
      escalation: "IMMEDIATE_HUMAN_REVIEW",
      alert:
        "Symptoms consistent with a possible severe allergic reaction were noted and flagged for immediate review — please seek urgent medical attention. This is not a diagnosis.",
      matchedTerms: [],
    });
  }

  if (!isChest && breathing && !candidates.some((c) => c.ruleId === "ANAPHYLAXIS_LIKE")) {
    candidates.push({
      ruleId: "BREATHING_DIFFICULTY",
      name: "Difficulty breathing",
      severity: "CONCERN",
      escalation: "ROUTINE_REVIEW",
      alert:
        "Difficulty breathing was noted and flagged for review by a healthcare professional. This is not a diagnosis.",
      matchedTerms: [],
    });
  }

  return candidates;
}