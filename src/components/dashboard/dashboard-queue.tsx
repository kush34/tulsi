"use client";

import type { QueueItem } from "./dashboard-api";

type Props = {
  queue: QueueItem[];
  selectedId: string | null;
  title: string;
  onSelect: (id: string) => void;
};

function displayName(item: QueueItem): string {
  if (item.patient?.name) return item.patient.name;
  if (item.patient?.email) return item.patient.email.split("@")[0];
  return item.id.slice(-6);
}

export default function DashboardQueue({ queue, selectedId, title, onSelect }: Props) {
  return (
    <aside className="w-[240px] shrink-0 border-r border-[#e2e8f0] bg-[#fafbfc] px-5 py-6">
      <h2 className="mb-4 text-[13px] font-semibold text-[#172033]">{title}</h2>
      <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
        {queue.map((item) => {
          const isActive = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`
                rounded-[8px] px-3 py-2.5 text-left transition-colors
                ${isActive ? "bg-[#eaf3ff] text-[#1768d5]" : "text-[#334155] hover:bg-[#f1f5f9]"}
              `}
            >
              <span className="block truncate text-[13px] font-medium">{displayName(item)}</span>
              <span className="mt-0.5 block text-[11px] text-[#94a3b8]">
                {new Date(item.startedAt).toLocaleDateString()} · {item.counts.answers} answers
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
