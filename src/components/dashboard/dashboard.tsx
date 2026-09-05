"use client";

import { useState } from "react";
import { isRTL, type Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";
import DashboardAlerts from "./dashboard-alerts";
import DashboardQueue from "./dashboard-queue";
import DashboardSections from "./dashboard-sections";
import ProfileButton from "@/components/profile/profile-button";
import { DashboardMessage } from "./dashboard-states";
import DashboardTimeline from "./dashboard-timeline";
import { useDoctorQueue } from "./use-doctor-queue";

type Tab = "summary" | "timeline" | "documents" | "fullHistory";

export default function DoctorDashboard({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { doctorDashboard: dict } = dictionary;
  const work = dict.worklist;
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const {
    status,
    queue,
    selectedId,
    select,
    review,
    entries,
    detailLoading,
    error,
    verify,
    resolve,
    dismiss,
    finalize,
  } = useDoctorQueue();

  const selected = queue.find((q) => q.id === selectedId) ?? null;
  const patientName = selected?.patient?.name ?? selected?.patient?.email ?? "—";

  return (
    <div className="min-h-screen bg-[#e9e9e9] p-6" dir={isRTL(locale) ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        <header className="flex items-center justify-between border-b border-[#e2e8f0] px-8 py-4">
          <div className="flex items-center gap-3">
            <ProfileButton locale={locale} />
            <span className="text-[19px] font-semibold tracking-[-0.02em] text-[#1768d5]">
              {dict.brand}
            </span>
            <span className="text-[13px] font-medium text-[#94a3b8]">
              {dict.subtitle}
            </span>
          </div>
          <div className="text-[13px] font-medium text-[#64748b]">{dict.doctorLabel}</div>
        </header>

        {status === "loading" && (
          <p className="px-8 py-10 text-[14px] text-[#64748b]">{work.loading}</p>
        )}

        {status === "error" && (
          <div className="px-8 py-10">
            <DashboardMessage
              title={work.loadError}
              body={error}
              actionLabel={work.retry}
              onAction={() => window.location.reload()}
            />
          </div>
        )}

        {status === "empty" && (
          <div className="px-8 py-10">
            <DashboardMessage title={work.emptyTitle} body={work.emptyBody} />
          </div>
        )}

        {(status === "ready" || (status === "empty" && selected)) && selected && (
          <div className="flex">
            <DashboardQueue
              queue={queue}
              selectedId={selectedId}
              title={dict.queueTitle}
              onSelect={select}
            />

            <section className="min-w-0 flex-1 bg-[#f8fafc] px-8 py-6">
              <div className="mb-5">
                <h1 className="truncate text-[22px] font-semibold text-[#172033]">{patientName}</h1>
                <p className="mt-1 text-[13px] text-[#64748b]">
                  {[selected.patient?.email, new Date(selected.startedAt).toLocaleString()]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              {detailLoading || !review ? (
                <p className="text-[14px] text-[#64748b]">{work.loading}</p>
              ) : (
                <>
                  <div className="mb-6 flex gap-7 border-b border-[#e2e8f0]">
                    {(
                      [
                        ["summary", dict.tabs.summary],
                        ["timeline", dict.tabs.timeline],
                        ["documents", dict.tabs.documents],
                        ["fullHistory", dict.tabs.fullHistory],
                      ] as [Tab, string][]
                    ).map(([tab, label]) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`
                          -mb-px border-b-2 pb-3 text-[13px] font-medium transition-colors
                          ${activeTab === tab ? "border-[#1768d5] text-[#1768d5]" : "border-transparent text-[#64748b] hover:text-[#172033]"}
                        `}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "summary" && (
                    <>
                      <DashboardAlerts
                        title={work.alertsTitle}
                        redFlags={review.redFlags}
                        contradictions={review.contradictions}
                        resolveLabel={work.resolve}
                        dismissLabel={work.dismiss}
                        onResolve={(id) => void resolve(id)}
                        onDismiss={(id) => void dismiss(id)}
                      />
                      <DashboardSections
                        sections={review.sections}
                        labels={{
                          verify: work.verify,
                          verified: work.verified,
                          missingTitle: work.missingTitle,
                          confirmedByPatient: work.confirmedByPatient,
                          collected: work.collected,
                        }}
                        onVerify={(id) => void verify(id)}
                      />
                      {review.summary && (
                        <div className="mt-3 rounded-[13px] border border-[#bfdbfe] bg-[#eaf3ff] px-5 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#1768d5]">
                            {work.summaryTitle}
                          </p>
                          <p className="mt-1 text-[14px] leading-6 text-[#253044]">{review.summary}</p>
                        </div>
                      )}
                      <div className="mt-8 flex items-center justify-between gap-4">
                        <p className="text-[12px] text-red-600">{error || ""}</p>
                        <button
                          type="button"
                          onClick={() => void finalize()}
                          className="h-[42px] rounded-[9px] bg-[#15803d] px-6 text-[13px] font-semibold text-white transition-colors hover:bg-[#166534]"
                        >
                          {work.finalize}
                        </button>
                      </div>
                    </>
                  )}

                  {activeTab === "timeline" && (
                    <DashboardTimeline entries={entries} emptyLabel={work.timelineEmpty} />
                  )}

                  {activeTab === "documents" && (
                    <p className="text-[14px] text-[#64748b]">{work.documentsEmpty}</p>
                  )}

                  {activeTab === "fullHistory" && (
                    <DashboardSections
                      sections={review.sections}
                      labels={{
                        verify: work.verify,
                        verified: work.verified,
                        missingTitle: work.missingTitle,
                        confirmedByPatient: work.confirmedByPatient,
                        collected: work.collected,
                      }}
                      onVerify={(id) => void verify(id)}
                    />
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
