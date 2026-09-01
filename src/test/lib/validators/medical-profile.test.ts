import { describe, expect, it } from "vitest";
import { medicalProfileUpdateSchema } from "@/lib/validators/medical-profile";

const validAllergy = { name: "Penicillin", severity: "severe", reaction: "Rash" };

describe("medicalProfileUpdateSchema", () => {
  it("accepts an empty payload", () => {
    expect(medicalProfileUpdateSchema.parse({})).toEqual({});
  });

  it("accepts null arrays and null socialHistory", () => {
    expect(
      medicalProfileUpdateSchema.parse({ allergies: null, socialHistory: null })
    ).toEqual({ allergies: null, socialHistory: null });
  });

  it("accepts empty arrays and empty socialHistory", () => {
    expect(
      medicalProfileUpdateSchema.parse({
        allergies: [],
        conditions: [],
        socialHistory: {},
      })
    ).toEqual({ allergies: [], conditions: [], socialHistory: {} });
  });

  it("accepts a fully populated valid payload", () => {
    const payload = {
      allergies: [validAllergy],
      conditions: [{ name: "Asthma", status: "active", diagnosedAt: "2005" }],
      medications: [{ name: "Salbutamol", dosage: "100mcg", frequency: "As needed" }],
      surgeries: [{ name: "Appendectomy", date: "2010", hospital: "City General" }],
      familyHistory: [{ condition: "Diabetes", relation: "Mother" }],
      socialHistory: { smoking: "Non-smoker", exercise: "5x/week" },
    };
    expect(medicalProfileUpdateSchema.parse(payload)).toEqual(payload);
  });

  it("accepts exactly 100 items (boundary)", () => {
    const allergies = Array.from({ length: 100 }, (_, i) => ({ name: `A${i}` }));
    const result = medicalProfileUpdateSchema.parse({ allergies });
    expect(result.allergies).toHaveLength(100);
  });

  it("rejects 101 items (boundary)", () => {
    const allergies = Array.from({ length: 101 }, (_, i) => ({ name: `A${i}` }));
    expect(() => medicalProfileUpdateSchema.parse({ allergies })).toThrow();
  });

  it("rejects a non-array allergies field", () => {
    expect(() => medicalProfileUpdateSchema.parse({ allergies: "Penicillin" })).toThrow();
  });

  it("rejects an allergy missing its name", () => {
    expect(() => medicalProfileUpdateSchema.parse({ allergies: [{}] })).toThrow();
  });

  it("rejects empty and over-length names", () => {
    expect(() => medicalProfileUpdateSchema.parse({ allergies: [{ name: "" }] })).toThrow();
    expect(() =>
      medicalProfileUpdateSchema.parse({ allergies: [{ name: "x".repeat(201) }] })
    ).toThrow();
    expect(medicalProfileUpdateSchema.parse({ allergies: [{ name: "x".repeat(200) }] })).toBeDefined();
  });

  it("rejects invalid enum values", () => {
    expect(() =>
      medicalProfileUpdateSchema.parse({ allergies: [{ name: "X", severity: "fatal" }] })
    ).toThrow();
    expect(() =>
      medicalProfileUpdateSchema.parse({
        conditions: [{ name: "Asthma", status: "unknown" }],
      })
    ).toThrow();
  });

  it("rejects over-length optional strings", () => {
    expect(() =>
      medicalProfileUpdateSchema.parse({ allergies: [{ name: "X", notes: "n".repeat(1001) }] })
    ).toThrow();
    expect(() =>
      medicalProfileUpdateSchema.parse({ socialHistory: { smoking: "s".repeat(101) } })
    ).toThrow();
  });

  it("strips unknown keys", () => {
    const result = medicalProfileUpdateSchema.parse({
      allergies: [{ name: "X", rogue: "dropped" }],
      bogus: true,
    });
    expect("bogus" in result).toBe(false);
    expect("rogue" in result.allergies![0]).toBe(false);
  });
});