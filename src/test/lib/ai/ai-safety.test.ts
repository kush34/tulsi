import { describe, expect, it } from "vitest";
import { clinicalExtractionSchema } from "@/lib/ai/schemas";
import { applyExtractionSafety } from "@/lib/ai/safety";
import { extractJson } from "@/lib/ai/json";

describe("clinicalExtractionSchema", () => {
  it("accepts a valid extraction", () => {
    const parsed = clinicalExtractionSchema.safeParse({
      facts: [{ field: "complaint", value: "fever" }],
      diagnosesProposed: [],
      prescriptionsProposed: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a diagnosis in the payload", () => {
    const parsed = clinicalExtractionSchema.safeParse({
      facts: [{ field: "diagnosis", value: "pneumonia" }],
      diagnosesProposed: [],
      prescriptionsProposed: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects malformed facts", () => {
    const parsed = clinicalExtractionSchema.safeParse({ facts: [{ value: "missing field" }] });
    expect(parsed.success).toBe(false);
  });
});

describe("applyExtractionSafety", () => {
  const allowed = new Set(["complaint", "severity"]);

  it("accepts facts within the allowed fields", () => {
    const extraction = {
      facts: [
        { field: "complaint", value: "fever" },
        { field: "severity", value: "moderate" },
      ],
      diagnosesProposed: [] as string[],
      prescriptionsProposed: [] as string[],
    };
    const result = applyExtractionSafety("CHIEF_COMPLAINT", allowed, extraction);
    expect(result.safetyViolations).toEqual([]);
    expect(result.acceptedFacts.map((f) => f.field)).toEqual(["complaint", "severity"]);
  });

  it("drops fields not in the allowed list silently", () => {
    const extraction = {
      facts: [{ field: "privateThoughts", value: "x" }],
      diagnosesProposed: [] as string[],
      prescriptionsProposed: [] as string[],
    };
    const result = applyExtractionSafety("CHIEF_COMPLAINT", allowed, extraction);
    expect(result.acceptedFacts).toEqual([]);
    expect(result.safetyViolations).toEqual([]);
  });

  it("rejects the whole extraction when a diagnosis is proposed", () => {
    const extraction = {
      facts: [{ field: "complaint", value: "fever" }],
      diagnosesProposed: ["viral fever"],
      prescriptionsProposed: [] as string[],
    };
    const result = applyExtractionSafety("CHIEF_COMPLAINT", allowed, extraction);
    expect(result.acceptedFacts).toEqual([]);
    expect(result.safetyViolations.some((v) => v.includes("diagnosis"))).toBe(true);
  });

  it("rejects the whole extraction when a prescription is proposed", () => {
    const extraction = {
      facts: [{ field: "complaint", value: "fever" }],
      diagnosesProposed: [] as string[],
      prescriptionsProposed: ["paracetamol 500mg"],
    };
    const result = applyExtractionSafety("CHIEF_COMPLAINT", allowed, extraction);
    expect(result.acceptedFacts).toEqual([]);
    expect(result.safetyViolations.some((v) => v.includes("prescription"))).toBe(true);
  });
});

describe("extractJson", () => {
  it("parses JSON inside markdown fences", () => {
    expect(extractJson("```json\n{\"a\":1}\n```")).toEqual({ a: 1 });
  });

  it("parses leading-whitespace JSON", () => {
    expect(extractJson('  {"a": [1, 2]}')).toEqual({ a: [1, 2] });
  });

  it("throws on non-JSON output", () => {
    expect(() => extractJson("I could not parse this.")).toThrow();
  });
});