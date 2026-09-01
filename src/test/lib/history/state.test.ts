import { describe, expect, it } from "vitest";
import { ConflictError } from "@/lib/errors";
import { ALLOWED_TRANSITIONS, assertTransition, canTransition, isWritable } from "@/lib/history/state";

describe("history state machine", () => {
  it("accepts every declared transition", () => {
    for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
      for (const to of targets) {
        expect(canTransition(from as never, to as never)).toBe(true);
        expect(() => assertTransition(from as never, to as never)).not.toThrow();
      }
    }
  });

  it("rejects a transition to the same status", () => {
    expect(canTransition("IN_PROGRESS", "IN_PROGRESS")).toBe(false);
    expect(() => assertTransition("IN_PROGRESS", "IN_PROGRESS")).toThrow(ConflictError);
  });

  it("rejects an illegal transition", () => {
    expect(canTransition("PATIENT_REVIEW", "IN_PROGRESS")).toBe(false);
    expect(() => assertTransition("PATIENT_REVIEW", "IN_PROGRESS")).toThrow(ConflictError);
  });

  it("only accepts answers while IN_PROGRESS or PAUSED", () => {
    expect(isWritable("IN_PROGRESS")).toBe(true);
    expect(isWritable("PAUSED")).toBe(true);
    expect(isWritable("PATIENT_REVIEW")).toBe(false);
    expect(isWritable("COMPLETED")).toBe(false);
  });
});