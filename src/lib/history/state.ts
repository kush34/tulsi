import { HistorySessionStatus } from "@prisma/client";
import { ConflictError } from "@/lib/errors";

export const ALLOWED_TRANSITIONS: Record<HistorySessionStatus, HistorySessionStatus[]> = {
  NOT_STARTED: [HistorySessionStatus.IN_PROGRESS, HistorySessionStatus.CANCELLED],
  IN_PROGRESS: [
    HistorySessionStatus.PAUSED,
    HistorySessionStatus.PATIENT_REVIEW,
    HistorySessionStatus.CANCELLED,
  ],
  PAUSED: [HistorySessionStatus.IN_PROGRESS, HistorySessionStatus.CANCELLED],
  PATIENT_REVIEW: [HistorySessionStatus.DOCTOR_REVIEW, HistorySessionStatus.CANCELLED],
  DOCTOR_REVIEW: [HistorySessionStatus.COMPLETED, HistorySessionStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export const WRITABLE_STATUSES: HistorySessionStatus[] = [
  HistorySessionStatus.IN_PROGRESS,
  HistorySessionStatus.PAUSED,
];

export function isWritable(status: HistorySessionStatus): boolean {
  return WRITABLE_STATUSES.includes(status);
}

export function assertTransition(from: HistorySessionStatus, to: HistorySessionStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new ConflictError(`Cannot transition history session from ${from} to ${to}`);
  }
}

export function canTransition(from: HistorySessionStatus, to: HistorySessionStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}