"use client";

import type { DoctorReviewSection } from "./dashboard-api";

type Labels = {
  verify: string;
  verified: string;
  missingTitle: string;
  confirmedByPatient: string;
  collected: string;
};

type Props = {
  sections: Record<string, DoctorReviewSection>;
  labels: Labels;
  onVerify: (factId: string) => void;
};

function badge(verification: string, labels: Labels): string {
  if (verification === "DOCTOR_VERIFIED") return labels.verified;
  if (verification === "PATIENT_CONFIRMED") return labels.confirmedByPatient;
  return labels.collected;
}

export default function DashboardSections({ sections, labels, onVerify }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(sections).map(([sectionId, section]) => (
        <div key={sectionId} className="rounded-[13px] border border-[#e2e8f0] bg-white px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#1768d5]">
            {section.label}
          </p>
          <div className="divide-y divide-[#eef2f7]">
            {section.facts.map((fact) => {
              const done = fact.verification === "DOCTOR_VERIFIED";
              return (
                <div key={fact.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#94a3b8]">
                      {fact.field}
                    </p>
                    <p className="mt-0.5 text-[14px] text-[#253044]">{fact.value}</p>
                    <p className="mt-0.5 text-[11px] text-[#94a3b8]">{badge(fact.verification, labels)}</p>
                  </div>
                  {done ? (
                    <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-[12px] font-semibold text-green-700">
                      {labels.verified}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onVerify(fact.id)}
                      className="shrink-0 text-[13px] font-semibold text-[#1768d5] hover:text-[#155fc3]"
                    >
                      {labels.verify}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {section.missing.length > 0 && (
            <p className="mt-2 text-[12px] text-[#94a3b8]">
              {labels.missingTitle}: {section.missing.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
