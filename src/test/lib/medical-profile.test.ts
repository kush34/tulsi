import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import type { MedicalProfileUpdateInput } from "@/lib/validators/medical-profile";
import { computeMedicalProfileChanges, serializeJson } from "@/lib/medical-profile";

const empty: MedicalProfileUpdateInput = {};

const allergy = { name: "Penicillin", severity: "severe" as const };

describe("computeMedicalProfileChanges", () => {
  it("returns empty for two empty profiles", () => {
    expect(computeMedicalProfileChanges(empty, empty)).toEqual({});
  });

  it("returns empty when profiles are deep-equal", () => {
    const a: MedicalProfileUpdateInput = {
      allergies: [allergy],
      socialHistory: { smoking: "Non-smoker", exercise: "5x/week" },
    };
    expect(computeMedicalProfileChanges(a, structuredClone(a))).toEqual({});
  });

  it("only reports fields that actually changed", () => {
    const previous: MedicalProfileUpdateInput = {
      allergies: [allergy],
      conditions: [],
      socialHistory: { smoking: "Non-smoker" },
    };
    const next: MedicalProfileUpdateInput = {
      allergies: [allergy],
      conditions: [],
      socialHistory: { smoking: "Smoker" },
    };
    expect(computeMedicalProfileChanges(previous, next)).toEqual({
      socialHistory: { from: { smoking: "Non-smoker" }, to: { smoking: "Smoker" } },
    });
  });

  it("treats an absent field as null (from null to value)", () => {
    expect(computeMedicalProfileChanges(empty, { allergies: [allergy] })).toEqual({
      allergies: { from: null, to: [allergy] },
    });
  });

  it("treats a removed field as null (from value to null)", () => {
    expect(computeMedicalProfileChanges({ allergies: [allergy] }, empty)).toEqual({
      allergies: { from: [allergy], to: null },
    });
  });

  it("reports explicit null clears against a populated value", () => {
    const previous: MedicalProfileUpdateInput = { allergies: [allergy] };
    const next: MedicalProfileUpdateInput = { allergies: null };
    expect(computeMedicalProfileChanges(previous, next)).toEqual({
      allergies: { from: [allergy], to: null },
    });
  });

  it("captures array item insertion", () => {
    const previous: MedicalProfileUpdateInput = { allergies: [allergy] };
    const next: MedicalProfileUpdateInput = { allergies: [allergy, { name: "Peanuts" }] };
    const changes = computeMedicalProfileChanges(previous, next);
    expect(changes.allergies.to).toEqual([allergy, { name: "Peanuts" }]);
  });
});

describe("serializeJson", () => {
  it("returns undefined for unprovided values", () => {
    expect(serializeJson(undefined)).toBeUndefined();
  });

  it("returns Prisma.JsonNull for explicit null", () => {
    expect(serializeJson(null)).toBe(Prisma.JsonNull);
  });

  it("passes objects and arrays through unchanged", () => {
    const object = { smoking: "Non-smoker" };
    const array = [allergy];
    expect(serializeJson(object)).toBe(object);
    expect(serializeJson(array)).toBe(array);
  });
});