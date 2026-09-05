"use client";

import { isRTL, type Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";
import ConfirmationFact from "./confirmation-fact";
import { useConfirmationReview } from "./use-confirmation-review";

export default function ConfirmationSummary({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { confirmation: dict } = dictionary;
  const { status, review, error, saveFact, confirm } = useConfirmationReview();

  const busy = status === "confirming";
  const editable = status === "ready";

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-[#172033]"
      dir={isRTL(locale) ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#93c5fd]/25 blur-3xl animate-pulse" />
        <div className="absolute -right-32 -top-20 h-80 w-80 rounded-full bg-[#c4b5fd]/25 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[#f9a8d4]/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#67e8f9]/20 blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="mb-5">
          <div className="flex items-center justify-between">
            <div className="text-[20px] font-semibold tracking-[-0.02em] text-[#1768d5]">
              {dictionary.auth.brand}
            </div>
            <div className="text-[12px] font-medium text-[#64748b]">{dict.breadcrumb}</div>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-start pt-10 sm:pt-14 lg:pt-16">
          <div className="mx-auto w-full max-w-[920px]">
            <div className="mb-7">
              <h1 className="text-[27px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#172033] sm:text-[30px]">
                {status === "confirmed" ? dict.review.confirmedTitle : dict.title}
              </h1>
              <p className="mt-2 text-[13px] text-[#718096]">
                {status === "confirmed" ? dict.review.confirmedBody : dict.subtitle}
              </p>
            </div>

            {status === "loading" && (
              <p className="text-[14px] text-[#64748b]">{dict.review.loading}</p>
            )}

            {(status === "error" || (!review && status !== "loading" && status !== "empty")) && (
              <div className="rounded-[13px] border border-[#e2e8f0] bg-white px-5 py-4">
                <p className="text-[14px] text-red-600">{error || dict.review.loadError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 text-[13px] font-semibold text-[#1768d5] hover:text-[#155fc3]"
                >
                  {dict.review.retry}
                </button>
              </div>
            )}

            {status === "empty" && (
              <div className="rounded-[13px] border border-[#e2e8f0] bg-white px-5 py-6 text-center">
                <p className="text-[16px] font-semibold text-[#253044]">{dict.review.emptyTitle}</p>
                <p className="mt-2 text-[14px] text-[#64748b]">{dict.review.emptyBody}</p>
                <a
                  href={`/${locale}/assessment`}
                  className="mt-5 inline-block h-[46px] min-w-[190px] rounded-[9px] bg-[#1768d5] px-6 text-[13px] font-semibold leading-[46px] text-white hover:bg-[#155fc3]"
                >
                  {dict.review.startAssessment}
                </a>
              </div>
            )}

            {review && (status === "ready" || status === "confirming" || status === "confirmed") && (
              <>
                {(review.redFlags.length > 0 || review.contradictions.length > 0) && (
                  <div className="mb-3 rounded-[13px] border border-red-200 bg-red-50 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-red-700">
                      {dict.review.alertsTitle}
                    </p>
                    {[...review.redFlags, ...review.contradictions].map((flag) => (
                      <p key={flag.id} className="mt-1 text-[13px] leading-5 text-red-800">
                        {flag.description}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {Object.entries(review.sections).map(([sectionId, section]) => (
                    <div
                      key={sectionId}
                      className="rounded-[13px] border border-[#e2e8f0] bg-white px-5 py-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#1768d5]">
                        {section.label}
                      </p>
                      <div className="divide-y divide-[#eef2f7]">
                        {section.facts.map((fact) => (
                          <ConfirmationFact
                            key={fact.id}
                            fact={fact}
                            editable={editable}
                            editLabel={dict.edit}
                            saveLabel={dict.review.save}
                            savingLabel={dict.review.saving}
                            cancelLabel={dict.review.cancel}
                            onSave={saveFact}
                          />
                        ))}
                      </div>
                      {section.missing.length > 0 && (
                        <p className="mt-2 text-[12px] text-[#94a3b8]">
                          {dict.review.missingTitle}: {section.missing.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {review.summary && (
                  <div className="mt-3 rounded-[13px] border border-[#bfdbfe] bg-[#eaf3ff] px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#1768d5]">
                      {dict.review.summaryTitle}
                    </p>
                    <p className="mt-1 text-[14px] leading-6 text-[#253044]">{review.summary}</p>
                  </div>
                )}

                {error && <p className="mt-4 text-[12px] text-red-600">{error}</p>}

                {editable && (
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => void confirm()}
                      disabled={busy}
                      className="h-[46px] min-w-[190px] rounded-[9px] bg-[#1768d5] px-6 text-[13px] font-semibold text-white shadow-[0_5px_15px_rgba(23,104,213,0.18)] transition-all hover:bg-[#155fc3] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? dict.review.confirming : dict.confirmAndFinish}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
