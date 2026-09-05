"use client";

import { useCallback, useEffect, useState } from "react";
import { createUploadToken, listDocuments } from "./documents-api";
import type { KioskDocument } from "./documents-api";

export type UploadStepStatus = "loading" | "ready" | "error";

export function useDocumentUpload() {
  const [status, setStatus] = useState<UploadStepStatus>("loading");
  const [token, setToken] = useState("");
  const [documents, setDocuments] = useState<KioskDocument[]>([]);
  const [error, setError] = useState("");

  const refreshDocuments = useCallback(async () => {
    const items = await listDocuments().catch(() => null);
    if (items) setDocuments(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([createUploadToken(), listDocuments()])
      .then(([grant, items]) => {
        if (cancelled) return;
        setToken(grant.token);
        setDocuments(items);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load upload screen");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const timer = window.setInterval(() => void refreshDocuments(), 5000);
    return () => window.clearInterval(timer);
  }, [status, refreshDocuments]);

  return { status, token, documents, error, refreshDocuments };
}
