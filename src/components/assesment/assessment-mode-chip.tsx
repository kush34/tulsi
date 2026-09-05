"use client";

import type { AiStatus } from "./assessment-api";

type Props = {
  status: AiStatus | null;
  fallbackLabel: string;
};

export default function AssessmentModeChip({ status, fallbackLabel }: Props) {
  if (!status) return null;
  const live = status.active;
  const shortModel = status.model?.split("/").pop() ?? null;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-3 py-1
        text-[11px] font-semibold
        ${live ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}
      `}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-green-500" : "bg-amber-500"}`} />
      {live ? status.provider : fallbackLabel}
      {live && shortModel && <span className="font-medium opacity-80">· {shortModel}</span>}
    </span>
  );
}
