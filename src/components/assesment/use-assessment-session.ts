"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i8n/config";
import {
  cancelSession,
  completeSession,
  listSessionsByStatus,
  loadSession,
  loadTranscript,
  selectOpenTarget,
  startSession,
  submitAnswer,
} from "./assessment-api";
import type { SessionPayload, TranscriptEntry } from "./assessment-api";

export type SessionStatus = "loading" | "ready" | "submitting" | "completing" | "done" | "error";

type OpenedSession = { kind: "loaded"; payload: SessionPayload } | { kind: "confirmation" };

async function resolveTarget() {
  const [inProgress, paused, inReview, doctorReview] = await Promise.all([
    listSessionsByStatus("IN_PROGRESS").catch(() => []),
    listSessionsByStatus("PAUSED").catch(() => []),
    listSessionsByStatus("PATIENT_REVIEW").catch(() => []),
    listSessionsByStatus("DOCTOR_REVIEW").catch(() => []),
  ]);
  return selectOpenTarget({
    inProgressId: inProgress[0]?.id,
    pausedId: paused[0]?.id,
    patientReviewId: inReview[0]?.id,
    doctorReviewId: doctorReview[0]?.id,
  });
}

async function openOrCreate(): Promise<OpenedSession> {
  const first = await resolveTarget();
  if (first.kind === "load") {
    return { kind: "loaded", payload: await loadSession(first.sessionId) };
  }
  if (first.kind === "confirmation") return first;
  try {
    return { kind: "loaded", payload: await startSession() };
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("already exists")) throw err;
    const retry = await resolveTarget();
    if (retry.kind === "load") {
      return { kind: "loaded", payload: await loadSession(retry.sessionId) };
    }
    if (retry.kind === "confirmation") return retry;
    throw err;
  }
}

export function useAssessmentSession(locale: Locale) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [payload, setPayload] = useState<SessionPayload | null>(null);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState("");

  const refreshTranscript = useCallback(async (sessionId: string) => {
    const data = await loadTranscript(sessionId).catch(() => null);
    if (data) setEntries(data.entries);
  }, []);

  useEffect(() => {
    let cancelled = false;
    openOrCreate()
      .then(async (result) => {
        if (cancelled) return;
        if (result.kind === "confirmation") {
          router.push(`/${locale}/confirmation`);
          return;
        }
        setPayload(result.payload);
        setStatus(result.payload.currentQuestion ? "ready" : "done");
        await refreshTranscript(result.payload.session.id);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not start assessment");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTranscript, router, locale]);

  const answer = useCallback(
    async (text: string, inputType: "TEXT" | "VOICE"): Promise<SessionPayload | null> => {
      if (!payload?.currentQuestion || status === "submitting") return null;
      const trimmed = text.trim().slice(0, 4000);
      if (!trimmed) return null;
      setStatus("submitting");
      setError("");
      try {
        const next = await submitAnswer(payload.session.id, {
          questionId: payload.currentQuestion.id,
          answer: trimmed,
          inputType,
        });
        setPayload(next);
        setStatus(next.currentQuestion ? "ready" : "done");
        await refreshTranscript(next.session.id);
        return next;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit answer");
        setStatus("ready");
        return null;
      }
    },
    [payload, status, refreshTranscript],
  );

  const finish = useCallback(async () => {
    if (!payload) return;
    setStatus("completing");
    try {
      await completeSession(payload.session.id);
      const next = await loadSession(payload.session.id);
      setPayload(next);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish assessment");
      setStatus("ready");
    }
  }, [payload]);

  const restart = useCallback(async (): Promise<boolean> => {
    if (!payload || status === "loading" || status === "submitting" || status === "completing") {
      return false;
    }
    setStatus("completing");
    setError("");
    try {
      await cancelSession(payload.session.id);
      const fresh = await startSession();
      setPayload(fresh);
      setEntries([]);
      setStatus(fresh.currentQuestion ? "ready" : "done");
      await refreshTranscript(fresh.session.id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restart assessment");
      const current = await loadSession(payload.session.id).catch(() => null);
      if (current) setPayload(current);
      setStatus("ready");
      return false;
    }
  }, [payload, status, refreshTranscript]);

  return { status, payload, entries, error, answer, finish, restart };
}
