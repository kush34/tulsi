"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "./assessment-api";

export default function AssessmentTranscript({ entries }: { entries: TranscriptEntry[] }) {
  const answered = entries.filter((e) => e.answer);
  const scrollRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [answered.length]);

  if (answered.length === 0) return null;

  return (
    <ol
      ref={scrollRef}
      aria-label="Conversation record"
      className="mb-8 max-h-[32vh] space-y-4 overflow-y-auto pr-2"
    >
      {answered.map((entry) => (
        <li key={entry.questionId} className="space-y-2">
          <div className="flex justify-start">
            <p className="max-w-[85%] rounded-[12px] rounded-tl-[4px] bg-[#eaf3ff] px-4 py-2.5 text-[13px] leading-5 text-[#253044]">
              {entry.question}
            </p>
          </div>
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-[12px] rounded-tr-[4px] bg-white px-4 py-2.5 text-[13px] leading-5 text-[#172033] shadow-[0_1px_4px_rgba(23,32,51,0.08)]">
              {entry.answer}
              {entry.inputType === "VOICE" && (
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-[#94a3b8]">
                  Spoken
                </span>
              )}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
