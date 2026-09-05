"use client";

import { useCallback, useEffect, useState } from "react";
import {
  confirmReview,
  findReviewSessionId,
  loadReview,
  updateFact,
} from "./confirmation-api";
import type { ReviewData } from "./confirmation-api";

export type ReviewStatus = "loading" | "ready" | "empty" | "confirming" | "confirmed" | "error";

export function useConfirmationReview() {
  const [status, setStatus] = useState<ReviewStatus>("loading");
  const [review, setReview] = useState<ReviewData | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async (sessionId: string) => {
    const data = await loadReview(sessionId);
    setReview(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    findReviewSessionId()
      .then(async (found) => {
        if (cancelled) return;
        if (!found) {
          setStatus("empty");
          return;
        }
        const data = await refresh(found.id);
        if (cancelled) return;
        setStatus(data.status === "PATIENT_REVIEW" ? "ready" : "confirmed");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load review");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const saveFact = useCallback(
    async (factId: string, value: string): Promise<boolean> => {
      if (!review || value.trim().length === 0) return false;
      try {
        await updateFact(review.sessionId, factId, value.trim().slice(0, 5000));
        await refresh(review.sessionId);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save change");
        return false;
      }
    },
    [review, refresh],
  );

  const confirm = useCallback(async (): Promise<boolean> => {
    if (!review) return false;
    setStatus("confirming");
    setError("");
    try {
      await confirmReview(review.sessionId);
      await refresh(review.sessionId);
      setStatus("confirmed");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm");
      setStatus("ready");
      return false;
    }
  }, [review, refresh]);

  return { status, review, error, saveFact, confirm };
}
