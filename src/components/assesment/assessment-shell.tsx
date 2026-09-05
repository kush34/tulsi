"use client";

import { isRTL, type Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";
import ProfileButton from "@/components/profile/profile-button";

export type VoiceGlowState = "idle" | "listening" | "speaking";

type Props = {
  locale: Locale;
  heading: string;
  progressPct: number;
  voiceState?: VoiceGlowState;
  chip?: React.ReactNode;
  children: React.ReactNode;
};

export default function AssessmentShell({
  locale,
  heading,
  progressPct,
  voiceState = "idle",
  chip,
  children,
}: Props) {
  const dictionary = getDictionary(locale);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-[#172033]"
      dir={isRTL(locale) ? "rtl" : "ltr"}
    >
      <div className="voice-edge-glow" data-state={voiceState} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#93c5fd]/25 blur-3xl animate-pulse" />
        <div className="absolute -right-32 -top-20 h-80 w-80 rounded-full bg-[#c4b5fd]/25 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[#f9a8d4]/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#67e8f9]/20 blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ProfileButton locale={locale} />
              <div className="truncate text-[20px] font-semibold tracking-[-0.02em] text-[#1768d5]">
                {dictionary.auth.brand}
              </div>
            </div>
            {chip && <div className="flex shrink-0 justify-center">{chip}</div>}
            <div className="min-w-0 flex-1 text-right text-[12px] font-medium text-[#64748b]">
              {heading}
            </div>
          </div>
          <div className="mt-4 h-[5px] w-full overflow-hidden rounded-full bg-[#dce3eb]">
            <div
              className="h-full rounded-full bg-[#1768d5] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-start pt-10 sm:pt-14 lg:pt-16">
          <div className="mx-auto w-full max-w-[920px]">{children}</div>
        </section>

        <footer className="pb-2 pt-8 text-center">
          <p className="text-[11px] text-[#94a3b8]">
            {dictionary.assessment.preliminaryNotice}
          </p>
        </footer>
      </div>
    </main>
  );
}
