"use client";

import type { DoctorReviewFlag } from "./dashboard-api";

type Props = {
  title: string;
  redFlags: DoctorReviewFlag[];
  contradictions: DoctorReviewFlag[];
  resolveLabel: string;
  dismissLabel: string;
  onResolve: (flagId: string) => void;
  onDismiss: (flagId: string) => void;
};

function FlagRow({
  flag,
  critical,
  resolveLabel,
  dismissLabel,
  onResolve,
  onDismiss,
}: {
  flag: DoctorReviewFlag;
  critical: boolean;
  resolveLabel: string;
  dismissLabel: string;
  onResolve: (flagId: string) => void;
  onDismiss: (flagId: string) => void;
}) {
  return (
    <div
      className={`
        flex items-center justify-between gap-3 rounded-[12px] border px-5 py-3.5
        ${critical ? "border-[#fecaca] bg-[#fef2f2]" : "border-[#fde68a] bg-[#fffbeb]"}
      `}
    >
      <p className={`text-[13px] font-medium ${critical ? "text-[#b91c1c]" : "text-[#92400e]"}`}>
        {flag.description}
      </p>
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          onClick={() => onDismiss(flag.id)}
          className="text-[12px] font-medium text-[#64748b] hover:text-[#253044]"
        >
          {dismissLabel}
        </button>
        <button
          type="button"
          onClick={() => onResolve(flag.id)}
          className="text-[12px] font-semibold text-[#1768d5] hover:text-[#155fc3]"
        >
          {resolveLabel}
        </button>
      </div>
    </div>
  );
}

export default function DashboardAlerts({
  title,
  redFlags,
  contradictions,
  resolveLabel,
  dismissLabel,
  onResolve,
  onDismiss,
}: Props) {
  if (redFlags.length === 0 && contradictions.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#94a3b8]">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {redFlags.map((flag) => (
          <FlagRow
            key={flag.id}
            flag={flag}
            critical
            resolveLabel={resolveLabel}
            dismissLabel={dismissLabel}
            onResolve={onResolve}
            onDismiss={onDismiss}
          />
        ))}
        {contradictions.map((flag) => (
          <FlagRow
            key={flag.id}
            flag={flag}
            critical={false}
            resolveLabel={resolveLabel}
            dismissLabel={dismissLabel}
            onResolve={onResolve}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}
