"use client";

import { useCallback, useEffect, useState } from "react";
import {
  dismissFlag,
  finalizeSession,
  loadDoctorReview,
  loadQueue,
  loadTranscript,
  resolveFlag,
  verifyFact,
} from "./dashboard-api";
import type { DoctorReview, QueueItem, TranscriptEntry } from "./dashboard-api";

export type QueueStatus = "loading" | "ready" | "empty" | "error";

export function useDoctorQueue() {
  const [status, setStatus] = useState<QueueStatus>("loading");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [review, setReview] = useState<DoctorReview | null>(null);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState("");

  const detailLoading = !!selectedId && (!review || review.sessionId !== selectedId);

  const fetchQueue = useCallback(async () => loadQueue(), []);

  useEffect(() => {
    let cancelled = false;
    fetchQueue()
      .then((items) => {
        if (cancelled) return;
        setQueue(items);
        setStatus(items.length === 0 ? "empty" : "ready");
        if (items.length > 0) setSelectedId(items[0].id);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load worklist");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [fetchQueue]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    Promise.all([loadDoctorReview(selectedId), loadTranscript(selectedId).catch(() => null)])
      .then(([data, transcript]) => {
        if (cancelled) return;
        setReview(data);
        setEntries(transcript?.entries ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load session");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const refreshDetail = useCallback(async () => {
    if (!selectedId) return;
    const [data, transcript] = await Promise.all([
      loadDoctorReview(selectedId),
      loadTranscript(selectedId).catch(() => null),
    ]);
    setReview(data);
    setEntries(transcript?.entries ?? []);
  }, [selectedId]);

  const act = useCallback(
    async (fn: () => Promise<unknown>, fallback: string) => {
      setError("");
      try {
        await fn();
        await refreshDetail();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : fallback);
        return false;
      }
    },
    [refreshDetail],
  );

  const verify = useCallback(
    (factId: string) =>
      selectedId ? act(() => verifyFact(selectedId, factId), "Could not verify fact") : Promise.resolve(false),
    [selectedId, act],
  );

  const resolve = useCallback(
    (flagId: string) =>
      selectedId ? act(() => resolveFlag(selectedId, flagId), "Could not resolve flag") : Promise.resolve(false),
    [selectedId, act],
  );

  const dismiss = useCallback(
    (flagId: string) =>
      selectedId ? act(() => dismissFlag(selectedId, flagId), "Could not dismiss flag") : Promise.resolve(false),
    [selectedId, act],
  );

  const finalize = useCallback(async (): Promise<boolean> => {
    if (!selectedId) return false;
    setError("");
    try {
      await finalizeSession(selectedId);
      const items = await fetchQueue();
      setQueue(items);
      setSelectedId(items.length > 0 ? items[0].id : null);
      if (items.length === 0) {
        setReview(null);
        setEntries([]);
        setStatus("empty");
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finalize");
      return false;
    }
  }, [selectedId, fetchQueue]);

  return {
    status,
    queue,
    selectedId,
    select: setSelectedId,
    review,
    entries,
    detailLoading,
    error,
    verify,
    resolve,
    dismiss,
    finalize,
  };
}
