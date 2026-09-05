import { describe, expect, it } from "vitest";
import { selectOpenTarget } from "@/components/assesment/assessment-api";

describe("selectOpenTarget", () => {
  it("creates a fresh session when nothing is active", () => {
    expect(selectOpenTarget({})).toEqual({ kind: "create" });
  });

  it("loads the in-progress session first", () => {
    expect(
      selectOpenTarget({
        inProgressId: "s1",
        pausedId: "s2",
        patientReviewId: "s3",
        doctorReviewId: "s4",
      }),
    ).toEqual({ kind: "load", sessionId: "s1" });
  });

  it("resumes a paused session when nothing is in progress", () => {
    expect(selectOpenTarget({ pausedId: "s2" })).toEqual({ kind: "load", sessionId: "s2" });
  });

  it("sends review-stage sessions to the confirmation page", () => {
    expect(selectOpenTarget({ patientReviewId: "s3" })).toEqual({ kind: "confirmation" });
    expect(selectOpenTarget({ doctorReviewId: "s4" })).toEqual({ kind: "confirmation" });
  });

  it("prefers an answerable session over a review-stage one", () => {
    expect(selectOpenTarget({ pausedId: "s2", patientReviewId: "s3" })).toEqual({
      kind: "load",
      sessionId: "s2",
    });
  });
});
