"use client";

export interface KioskDocument {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  docType: string;
  createdAt: string;
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

export function createUploadToken(): Promise<{ token: string; expiresAt: string }> {
  return request("/api/v1/upload-tokens", { method: "POST", body: JSON.stringify({}) });
}

export function listDocuments(): Promise<KioskDocument[]> {
  return request<KioskDocument[]>("/api/v1/documents");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
