"use client";

export interface QueuePatient {
  id: string;
  name: string | null;
  email: string;
}

export interface QueueItem {
  id: string;
  status: string;
  currentSection: string;
  startedAt: string;
  patient: QueuePatient | null;
  counts: { answers: number; facts: number; flags: number };
}

export interface DoctorReviewFact {
  id: string;
  field: string;
  value: string;
  source: string;
  verification: string;
}

export interface DoctorReviewSection {
  label: string;
  facts: DoctorReviewFact[];
  missing: string[];
}

export interface DoctorReviewFlag {
  id: string;
  description: string;
  severity?: string | null;
  status: string;
}

export interface DoctorReview {
  sessionId: string;
  status: string;
  sections: Record<string, DoctorReviewSection>;
  redFlags: DoctorReviewFlag[];
  contradictions: DoctorReviewFlag[];
  summary: string | null;
  isVerified: boolean;
}

export interface TranscriptEntry {
  sequence: number;
  questionId: string;
  question: string;
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

export function loadQueue(): Promise<QueueItem[]> {
  return request<QueueItem[]>("/api/v1/history/sessions?status=DOCTOR_REVIEW&limit=50");
}

export function loadDoctorReview(sessionId: string): Promise<DoctorReview> {
  return request<DoctorReview>(`/api/v1/history/sessions/${sessionId}/doctor/review`);
}

export function loadTranscript(sessionId: string): Promise<{ entries: TranscriptEntry[] }> {
  return request(`/api/v1/history/sessions/${sessionId}/transcript`);
}

export function verifyFact(sessionId: string, factId: string): Promise<unknown> {
  return request(`/api/v1/history/sessions/${sessionId}/facts/${factId}/verify`, {
    method: "POST",
  });
}

export function resolveFlag(sessionId: string, flagId: string): Promise<unknown> {
  return request(`/api/v1/history/sessions/${sessionId}/flags/${flagId}/resolve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function dismissFlag(sessionId: string, flagId: string): Promise<unknown> {
  return request(`/api/v1/history/sessions/${sessionId}/flags/${flagId}/dismiss`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function finalizeSession(sessionId: string): Promise<{ status: string }> {
  return request(`/api/v1/history/sessions/${sessionId}/finalize`, { method: "POST" });
}
