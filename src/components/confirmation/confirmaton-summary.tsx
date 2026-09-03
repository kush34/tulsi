    "use client";

import { isRTL, type Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

type Summary = {
  mainProblem: string;
  medicalConditions: string;
  medicines: string;
  documentsCount: number;
};

type ConfirmationSummaryProps = {
  locale: Locale;
  summary: Summary;
  onEdit?: (field: keyof Summary | "documents") => void;
  onConfirm?: () => void;
};

export default function ConfirmationSummary({
  locale,
  summary,
  onEdit,
  onConfirm,
}: ConfirmationSummaryProps) {
  const dictionary = getDictionary(locale);
  const { confirmation: dict } = dictionary;

  const rows = [
    { key: "mainProblem" as const, label: dict.mainProblem, value: summary.mainProblem },
    {
      key: "medicalConditions" as const,
      label: dict.medicalConditions,
      value: summary.medicalConditions,
    },
    { key: "medicines" as const, label: dict.medicines, value: summary.medicines },
    {
      key: "documents" as const,
      label: dict.documents,
      value: dict.documentsProcessed.replace("{count}", String(summary.documentsCount)),
    },
  ];

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-[#172033]"
      dir={isRTL(locale) ? "rtl" : "ltr"}
    >
      {/* =========================================================
          PASTEL AI EDGE GLOW
          ========================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute -left-32 -top-32
            h-80 w-80
            rounded-full
            bg-[#93c5fd]/25
            blur-3xl
            animate-pulse
          "
        />
        <div
          className="
            absolute -right-32 -top-20
            h-80 w-80
            rounded-full
            bg-[#c4b5fd]/25
            blur-3xl
            animate-pulse
          "
        />
        <div
          className="
            absolute -bottom-40 -left-20
            h-96 w-96
            rounded-full
            bg-[#f9a8d4]/20
            blur-3xl
            animate-pulse
          "
        />
        <div
          className="
            absolute -bottom-32 -right-32
            h-96 w-96
            rounded-full
            bg-[#67e8f9]/20
            blur-3xl
            animate-pulse
          "
        />
        <div
          className="
            absolute inset-0
            opacity-50
            blur-2xl
            bg-[linear-gradient(90deg,rgba(147,197,253,0.15),transparent_18%,transparent_82%,rgba(196,181,253,0.15))]
          "
        />
      </div>

      {/* =========================================================
          CONTENT
          ========================================================= */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-8 sm:px-10 lg:px-12">

        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center justify-between">
            <div className="text-[20px] font-semibold tracking-[-0.02em] text-[#1768d5]">
              {dictionary.auth.brand}
            </div>

            <div className="text-[12px] font-medium text-[#64748b]">
              {dict.breadcrumb}
            </div>
          </div>
        </header>

        {/* Main content */}
        <section className="flex flex-1 flex-col justify-start pt-10 sm:pt-14 lg:pt-16">
          <div className="mx-auto w-full max-w-[920px]">

            {/* Title */}
            <div className="mb-7">
              <h1 className="text-[27px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#172033] sm:text-[30px]">
                {dict.title}
              </h1>
              <p className="mt-2 text-[13px] text-[#718096]">
                {dict.subtitle}
              </p>
            </div>

            {/* Summary rows */}
            <div className="flex flex-col gap-3">
              {rows.map((row) => (
                <div
                  key={row.key}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-[13px]
                    border
                    border-[#e2e8f0]
                    bg-white
                    px-5
                    py-4
                  "
                >
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#94a3b8]">
                      {row.label}
                    </p>
                    <p className="mt-1 text-[14px] font-medium text-[#253044]">
                      {row.value}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEdit?.(row.key)}
                    className="text-[13px] font-semibold text-[#1768d5] transition-colors hover:text-[#155fc3]"
                  >
                    {dict.edit}
                  </button>
                </div>
              ))}
            </div>

            {/* Confirm */}
            <div className="mt-8">
              <button
                type="button"
                onClick={onConfirm}
                className="
                  h-[46px]
                  min-w-[190px]
                  rounded-[9px]
                  bg-[#1768d5]
                  px-6
                  text-[13px]
                  font-semibold
                  text-white
                  shadow-[0_5px_15px_rgba(23,104,213,0.18)]
                  transition-all
                  hover:bg-[#155fc3]
                "
              >
                {dict.confirmAndFinish}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}