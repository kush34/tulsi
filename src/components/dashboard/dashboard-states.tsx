"use client";

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function DashboardMessage({ title, body, actionLabel, onAction }: Props) {
  return (
    <div className="mx-auto max-w-[560px] rounded-[18px] bg-white px-8 py-10 text-center shadow-[0_4px_24px_rgba(23,32,51,0.06)]">
      <h1 className="text-[20px] font-semibold text-[#172033]">{title}</h1>
      <p className="mt-2 text-[14px] text-[#64748b]">{body}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 h-[42px] rounded-[9px] bg-[#1768d5] px-6 text-[13px] font-semibold text-white hover:bg-[#155fc3]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
