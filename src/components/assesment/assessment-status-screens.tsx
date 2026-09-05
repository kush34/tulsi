"use client";

type ScreenProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
};

function Centered({ title, body, actionLabel, onAction, actionHref }: ScreenProps) {
  return (
    <div className="mx-auto max-w-[560px] rounded-[18px] bg-white px-8 py-10 text-center shadow-[0_4px_24px_rgba(23,32,51,0.06)]">
      <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#172033]">{title}</h1>
      <p className="mt-3 text-[14px] leading-6 text-[#64748b]">{body}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 h-[46px] min-w-[130px] rounded-[9px] bg-[#1768d5] px-6 text-[13px] font-semibold text-white hover:bg-[#155fc3]"
        >
          {actionLabel}
        </button>
      )}
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-6 inline-block h-[46px] min-w-[130px] rounded-[9px] bg-[#1768d5] px-6 text-[13px] font-semibold leading-[46px] text-white hover:bg-[#155fc3]"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-[560px] rounded-[18px] bg-white px-8 py-10 text-center shadow-[0_4px_24px_rgba(23,32,51,0.06)]">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dbeafe] border-t-[#1768d5]" />
      <p className="mt-4 text-[14px] text-[#64748b]">{label}</p>
    </div>
  );
}

export function ErrorScreen(props: ScreenProps) {
  return <Centered {...props} />;
}

export function DoneScreen(props: ScreenProps) {
  return <Centered {...props} />;
}
