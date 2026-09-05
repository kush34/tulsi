"use client";

export interface SessionQuestion {
  id: string;
  question: string;
  section: string;
  questionType: string;
  sequence: number;
}

export interface SessionPayload {
  session: { id: string; status: string; currentSection: string };
  currentQuestion: SessionQuestion | null;
  questionCount: number;
  answerCount: number;
  reviewReady: boolean;
  missingInfo: string[];
  flags: { redFlags: unknown[]; contradictions: unknown[] };
}

export interface TranscriptEntry {
  sequence: number;
  questionId: string;
  question: string;
  section: string;
  answer: string | null;
  inputType: string | null;
}

function errorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null && "message" in err) {
      const msg = (err as { message: unknown }).message;
      if (typeof msg === "string") return msg;
    }
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || (body as { success?: boolean }).success === false) {
    throw new Error(errorMessage(body, `Request failed (${res.status})`));
  }
  return (body as { data: T }).data;
}

export function startSession(): Promise<SessionPayload> {
  return request<SessionPayload>("/api/v1/history/sessions", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function loadSession(sessionId: string): Promise<SessionPayload> {
  return request<SessionPayload>(`/api/v1/history/sessions/${sessionId}`);
}

export interface SessionRef {
  id: string;
  status: string;
}

export function listSessionsByStatus(status: string): Promise<SessionRef[]> {
  return request<SessionRef[]>(`/api/v1/history/sessions?status=${status}&limit=1`);
}

export type OpenTarget =
  | { kind: "load"; sessionId: string }
  | { kind: "confirmation" }
  | { kind: "create" };

export function selectOpenTarget(input: {
  inProgressId?: string;
  pausedId?: string;
  patientReviewId?: string;
  doctorReviewId?: string;
}): OpenTarget {
  const loadId = input.inProgressId ?? input.pausedId;
  if (loadId) return { kind: "load", sessionId: loadId };
  if (input.patientReviewId ?? input.doctorReviewId) return { kind: "confirmation" };
  return { kind: "create" };
}

export interface AiStatus {
  provider: string;
  active: boolean;
  model: string | null;
}

export function getAiStatus(): Promise<AiStatus> {
  return request<AiStatus>("/api/v1/history/ai-status");
}

export function submitAnswer(
  sessionId: string,
  input: { questionId: string; answer: string; inputType: "TEXT" | "VOICE" },
): Promise<SessionPayload> {
  return request<SessionPayload>(`/api/v1/history/sessions/${sessionId}/answers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loadTranscript(sessionId: string): Promise<{ entries: TranscriptEntry[] }> {
  return request(`/api/v1/history/sessions/${sessionId}/transcript`);
}

export function completeSession(sessionId: string): Promise<{ status: string }> {
  return request(`/api/v1/history/sessions/${sessionId}/complete`, { method: "POST" });
}

export function cancelSession(sessionId: string): Promise<{ id: string; status: string }> {
  return request(`/api/v1/history/sessions/${sessionId}/cancel`, { method: "POST" });
}
