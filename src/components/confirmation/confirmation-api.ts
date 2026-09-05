"use client";

export interface ReviewFact {
  id: string;
  field: string;
  value: string;
  source: string;
  verification: string;
}

export interface ReviewSection {
  label: string;
  facts: ReviewFact[];
  missing: string[];
}

export interface ReviewFlag {
  id: string;
  description: string;
  severity?: string | null;
}

export interface ReviewData {
  sessionId: string;
  status: string;
  sections: Record<string, ReviewSection>;
  redFlags: ReviewFlag[];
  contradictions: ReviewFlag[];
  summary: string | null;
  isVerified: boolean;
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

export async function findReviewSessionId(): Promise<{ id: string; status: string } | null> {
  for (const status of ["PATIENT_REVIEW", "DOCTOR_REVIEW"] as const) {
    const sessions = await request<{ id: string; status: string }[]>(
      `/api/v1/history/sessions?status=${status}&limit=1`,
    ).catch(() => []);
    if (sessions.length > 0) return sessions[0];
  }
  return null;
}

export function loadReview(sessionId: string): Promise<ReviewData> {
  return request<ReviewData>(`/api/v1/history/sessions/${sessionId}/review`);
}

export function confirmReview(sessionId: string): Promise<{ status: string }> {
  return request(`/api/v1/history/sessions/${sessionId}/review/confirm`, { method: "POST" });
}

export function updateFact(sessionId: string, factId: string, value: string): Promise<unknown> {
  return request(`/api/v1/history/sessions/${sessionId}/facts/${factId}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}
