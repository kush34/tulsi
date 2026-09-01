import { describe, expect, it } from "vitest";
import { HistoryFactVerification } from "@prisma/client";
import { evaluateRedFlags } from "@/lib/history/rules/red-flags";
import { evaluateContradictions } from "@/lib/history/rules/contradictions";
import { getMissingFields } from "@/lib/history/rules/missing-info";
import { getSection } from "@/lib/history/sections";
import type { HistoryFact } from "@prisma/client";

function fact(field: string, value: string, verification?: HistoryFactVerification): Partial<HistoryFact> {
  return { field, value, verification: verification ?? HistoryFactVerification.UNVERIFIED } as Partial<HistoryFact>;
}

describe("evaluateRedFlags", () => {
  it("flags a stroke-like combination as a potential emergency, not a diagnosis", () => {
    const result = evaluateRedFlags([
      fact("complaint", "face drooping on one side"),
      fact("associatedSymptoms", "slurred speech"),
    ] as HistoryFact[]);
    expect(result).toHaveLength(1);
    expect(result[0].ruleId).toBe("STROKE_LIKE");
    expect(result[0].severity).toBe("POTENTIAL_EMERGENCY");
    expect(result[0].escalation).toBe("IMMEDIATE_HUMAN_REVIEW");
    expect(result[0].alert).toContain("not a diagnosis");
  });

  it("flags chest pain with sweating as a possible cardiac emergency", () => {
    const result = evaluateRedFlags([fact("complaint", "chest pain"), fact("associatedSymptoms", "cold sweat")] as HistoryFact[]);
    expect(result.some((r) => r.ruleId === "CHEST_PAIN_EMERGENCY")).toBe(true);
  });

  it("flags isolated difficulty breathing as a concern", () => {
    const result = evaluateRedFlags([fact("complaint", "difficulty breathing")] as HistoryFact[]);
    expect(result.some((r) => r.ruleId === "BREATHING_DIFFICULTY")).toBe(true);
  });

  it("flags anaphylaxis-like throat swelling with rash", () => {
    const result = evaluateRedFlags([
      fact("complaint", "swelling of the throat"),
      fact("symptom", "itchy rash all over"),
    ] as HistoryFact[]);
    expect(result.some((r) => r.ruleId === "ANAPHYLAXIS_LIKE")).toBe(true);
  });

  it("produces no flags for routine complaints", () => {
    const result = evaluateRedFlags([
      fact("complaint", "mild headache for two days"),
      fact("associatedSymptoms", "slightly tired"),
    ] as HistoryFact[]);
    expect(result).toEqual([]);
  });

  it("ignores rejected facts", () => {
    const result = evaluateRedFlags([
      fact("complaint", "chest pain", HistoryFactVerification.REJECTED),
      fact("associatedSymptoms", "cold sweat"),
    ] as HistoryFact[]);
    expect(result.some((r) => r.ruleId === "CHEST_PAIN_EMERGENCY")).toBe(false);
  });

  it("does not flag mild recent-onset chest pain without companions", () => {
    const result = evaluateRedFlags([fact("complaint", "mild chest discomfort this morning")] as HistoryFact[]);
    expect(result.some((r) => r.ruleId === "CHEST_PAIN_EMERGENCY")).toBe(false);
  });

  it("handles empty input", () => {
    expect(evaluateRedFlags([])).toEqual([]);
  });

  it("handles non-signal fields only", () => {
    const result = evaluateRedFlags([fact("medication", "aspirin 75mg")] as HistoryFact[]);
    expect(result).toEqual([]);
  });
});

describe("evaluateContradictions", () => {
  it("flags a medication reversal", () => {
    const newFacts = new Map([["DRUG_HISTORY:takingMedications", ["no"]]]);
    const existing = new Map([["DRUG_HISTORY:takingMedications", ["I take amlodipine"]]]);
    const result = evaluateContradictions(newFacts, existing);
    expect(result.some((r) => r.ruleId === "VALUE_REVERSAL")).toBe(true);
  });

  it("flags medication vs no-medication conflict across fields", () => {
    const newFacts = new Map([["DRUG_HISTORY:takingMedications", ["no"]]]);
    const existing = new Map([["DRUG_HISTORY:medication", ["amlodipine 5mg"]]]);
    const result = evaluateContradictions(newFacts, existing);
    expect(result.some((r) => r.ruleId === "MEDICATION_CONFLICT")).toBe(true);
  });

  it("flags allergy conflict across fields", () => {
    const newFacts = new Map([["ALLERGY_HISTORY:hasAllergies", ["no"]]]);
    const existing = new Map([["ALLERGY_HISTORY:allergen", ["penicillin"]]]);
    const result = evaluateContradictions(newFacts, existing);
    expect(result.some((r) => r.ruleId === "ALLERGY_CONFLICT")).toBe(true);
  });

  it("raises no contradiction for consistent answers", () => {
    const newFacts = new Map([["DRUG_HISTORY:takingMedications", ["yes"]]]);
    const existing = new Map([["DRUG_HISTORY:medication", ["metformin"]]]);
    expect(evaluateContradictions(newFacts, existing)).toEqual([]);
  });

  it("ignores empty collections", () => {
    expect(evaluateContradictions(new Map(), new Map())).toEqual([]);
  });
});

describe("getMissingFields", () => {
  it("lists missing required fields of a section", () => {
    const section = getSection("HPI")!;
    expect(getMissingFields(section.requiredFields, new Set(["duration"]))).toEqual(["severity"]);
  });

  it("returns empty when all required fields are present", () => {
    const section = getSection("HPI")!;
    expect(getMissingFields(section.requiredFields, new Set(["duration", "severity"]))).toEqual([]);
  });

  it("handles null input safely", () => {
    const section = getSection("HPI")!;
    expect(getMissingFields(section.requiredFields, new Set())).toEqual(["duration", "severity"]);
  });
});