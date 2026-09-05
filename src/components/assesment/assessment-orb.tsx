"use client";

import type { SpeechPhase } from "./use-speech";

type Props = {
  phase: SpeechPhase;
  disabled: boolean;
  label: string;
  onTap: () => void;
};

export default function AssessmentOrb({ phase, disabled, label, onTap }: Props) {
  const listening = phase === "listening";
  const speaking = phase === "speaking";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="group relative flex h-[140px] w-full items-center justify-center overflow-visible disabled:cursor-not-allowed disabled:opacity-60 lg:w-[140px]"
    >
      {listening && (
        <>
          <span className="absolute h-[104px] w-[104px] animate-ping rounded-full bg-[#93c5fd]/30 [animation-duration:1.8s]" />
          <span className="absolute h-[88px] w-[88px] animate-ping rounded-full bg-[#c4b5fd]/30 [animation-duration:1.8s] [animation-delay:0.4s]" />
        </>
      )}
      <span
        className={`
          relative h-[72px] w-[72px] rounded-full transition-all duration-500
          ${
            listening || speaking
              ? "bg-[conic-gradient(from_0deg,#7dd3fc,#c4b5fd,#f9a8d4,#67e8f9,#7dd3fc)] shadow-[0_0_36px_rgba(147,197,253,0.65)]"
              : "bg-[#e2e8f0]"
          }
          ${speaking ? "animate-pulse" : ""}
          group-hover:scale-105
        `}
      >
        <span
          className={`
            absolute inset-[10px] rounded-full bg-white/85 backdrop-blur
            flex items-center justify-center
            ${listening ? "text-[#1768d5]" : "text-[#64748b]"}
          `}
        >
          {speaking ? (
            <span className="flex items-end gap-[3px]" aria-hidden="true">
              {[10, 18, 14, 20, 12].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] animate-pulse rounded-full bg-[#1768d5]"
                  style={{ height: h, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </span>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {listening ? (
                <>
                  <line x1="9" y1="5" x2="9" y2="19" />
                  <line x1="15" y1="5" x2="15" y2="19" />
                </>
              ) : (
                <>
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </>
              )}
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}
