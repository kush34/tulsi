"use client";

import { useState } from "react";
import { isRTL, type Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

type QuestionOption = {
  id: string;
  label: string;
};

type AssessmentQuestionProps = {
  locale: Locale;
  step?: number;
  totalSteps?: number;

  question?: string;
  options?: QuestionOption[];

  onContinue?: (answer: QuestionOption | null) => void;
};

export default function AssessmentQuestion({
  locale,
  step = 3,
  totalSteps = 6,
  onContinue,
}: AssessmentQuestionProps) {
  const dictionary = getDictionary(locale);
  const { assessment } = dictionary;

  const question = assessment.questions.defaultQuestion;
  const options = [
    { id: "chest-pain", label: assessment.questions.options.chestPain },
    { id: "fever", label: assessment.questions.options.fever },
    { id: "headache", label: assessment.questions.options.headache },
    { id: "none", label: assessment.questions.options.none },
  ] as const;

  const [selected, setSelected] = useState<QuestionOption | null>(null);
  const [listening, setListening] = useState(true);

  const progress = (step / totalSteps) * 100;

  function handleOption(option: QuestionOption) {
    setSelected(option);
    setListening(false);
  }

  function handleVoice() {
    setListening(true);

    // Connect your speech-to-text implementation here.
    // Example:
    // startSpeechRecognition();
  }

  function handleContinue() {
    onContinue?.(selected);
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-[#172033]"
      dir={isRTL(locale) ? "rtl" : "ltr"}
    >
      {/* =========================================================
          PASTEL AI EDGE GLOW
          ========================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-left blue glow */}
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

        {/* Top-right purple glow */}
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

        {/* Bottom-left pink glow */}
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

        {/* Bottom-right cyan glow */}
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

        {/* Soft overall edge gradient */}
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
              {assessment.stepOf
                .replace("{step}", String(step))
                .replace("{total}", String(totalSteps))}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 h-[5px] w-full overflow-hidden rounded-full bg-[#dce3eb]">
            <div
              className="
                h-full
                rounded-full
                bg-[#1768d5]
                transition-all
                duration-500
              "
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Main content */}
        <section className="flex flex-1 flex-col justify-start pt-10 sm:pt-14 lg:pt-16">

          <div className="mx-auto w-full max-w-[920px]">

            {/* Question */}
            <div className="mb-7">
              <h1 className="text-[27px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#172033] sm:text-[30px]">
                {question}
              </h1>

              <p className="mt-2 text-[13px] text-[#718096]">
                {assessment.subtitle}
              </p>
            </div>

            {/* Question area */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[140px_1fr]">

              {/* =================================================
                  VOICE PANEL
                  ================================================= */}

              <button
                type="button"
                onClick={handleVoice}
                className={`
                  group
                  relative
                  flex
                  h-[140px]
                  w-full
                  flex-col
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-[17px]
                  border
                  text-center
                  transition-all
                  duration-300
                  lg:w-[140px]

                  ${
                    listening
                      ? "border-[#bfdbfe] bg-[#eaf3ff]"
                      : "border-[#e2e8f0] bg-white hover:border-[#bfdbfe]"
                  }
                `}
              >
                {/* Voice glow */}
                {listening && (
                  <div
                    className="
                      pointer-events-none
                      absolute inset-0
                      rounded-[17px]
                      bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.20),transparent_65%)]
                    "
                  />
                )}

                {/* Microphone */}
                <div
                  className={`
                    relative
                    mb-3
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    ${
                      listening
                        ? "bg-[#dbeafe] text-[#1768d5]"
                        : "bg-[#f1f5f9] text-[#64748b]"
                    }
                  `}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="9"
                      y="2"
                      width="6"
                      height="12"
                      rx="3"
                    />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                </div>

                <span className="relative text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1768d5]">
                  {assessment.voice.label}
                </span>

                <span className="relative mt-2 text-[13px] font-medium text-[#253044]">
                  {listening
                    ? assessment.voice.listening
                    : assessment.voice.tapToSpeak}
                </span>
              </button>

              {/* =================================================
                  ANSWERS
                  ================================================= */}

              <div className="flex flex-col">

                {/* Voice transcript */}
                <div className="mb-5 min-h-[30px]">
                  {listening ? (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#1768d5]" />

                      <span className="text-[14px] font-medium text-[#253044]">
                        {assessment.voice.transcript}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[13px] text-[#94a3b8]">
                      {assessment.voice.chooseAnswer}
                    </span>
                  )}
                </div>

                {/* Options */}
                <div className="flex flex-wrap gap-3">
                  {options.map((option) => {
                    const isSelected = selected?.id === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleOption(option)}
                        className={`
                          min-h-[44px]
                          rounded-[9px]
                          border
                          px-5
                          py-2.5
                          text-left
                          text-[13px]
                          font-medium
                          transition-all
                          duration-200

                          ${
                            isSelected
                              ? "border-[#1768d5] bg-[#eaf3ff] text-[#1768d5] shadow-[0_0_0_3px_rgba(23,104,213,0.08)]"
                              : "border-[#dfe5ec] bg-white text-[#253044] hover:border-[#b8c9df] hover:bg-[#fafcff]"
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {/* Continue */}
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={handleContinue}
                    className="
                      h-[46px]
                      min-w-[130px]
                      rounded-[9px]
                      bg-[#1768d5]
                      px-6
                      text-[13px]
                      font-semibold
                      text-white
                      shadow-[0_5px_15px_rgba(23,104,213,0.18)]
                      transition-all
                      hover:bg-[#155fc3]
                      disabled:cursor-not-allowed
                      disabled:bg-[#cbd5e1]
                      disabled:shadow-none
                    "
                  >
                    {assessment.continue}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-2 pt-8 text-center">
          <p className="text-[11px] text-[#94a3b8]">
            {assessment.preliminaryNotice}
          </p>
        </footer>
      </div>
    </main>
  );
}