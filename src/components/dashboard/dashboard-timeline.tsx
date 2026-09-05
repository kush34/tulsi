"use client";

import type { TranscriptEntry } from "./dashboard-api";

export default function DashboardTimeline({
  entries,
  emptyLabel,
}: {
  entries: TranscriptEntry[];
  emptyLabel: string;
}) {
  const answered = entries.filter((e) => e.answer);
  if (answered.length === 0) {
    return <p className="text-[14px] text-[#64748b]">{emptyLabel}</p>;
  }

  return (
    <ol className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-2" aria-label="Conversation record">
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
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
