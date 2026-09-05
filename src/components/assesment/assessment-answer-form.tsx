"use client";

type Props = {
  liveTranscript: string;
  listening: boolean;
  input: string;
  busy: boolean;
  placeholder: string;
  sendLabel: string;
  sendingLabel: string;
  hint: string;
  onInput: (value: string) => void;
  onSend: () => void;
};

export default function AssessmentAnswerForm({
  liveTranscript,
  listening,
  input,
  busy,
  placeholder,
  sendLabel,
  sendingLabel,
  hint,
  onInput,
  onSend,
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="mb-5 min-h-[30px]">
        {listening ? (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#1768d5]" />
            <span className="text-[14px] font-medium text-[#253044]">
              {liveTranscript || hint}
            </span>
          </div>
        ) : (
          <span className="text-[13px] text-[#94a3b8]">{hint}</span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex gap-3"
      >
        <input
          value={input}
          onChange={(e) => onInput(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          className="h-[46px] min-w-0 flex-1 rounded-[9px] border border-[#dfe5ec] bg-white px-4 text-[13px] outline-none placeholder:text-[#94a3b8] focus:border-[#1768d5] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          className="h-[46px] min-w-[110px] rounded-[9px] bg-[#1768d5] px-6 text-[13px] font-semibold text-white shadow-[0_5px_15px_rgba(23,104,213,0.18)] transition-all hover:bg-[#155fc3] disabled:cursor-not-allowed disabled:bg-[#cbd5e1] disabled:shadow-none"
        >
          {busy ? sendingLabel : sendLabel}
        </button>
      </form>
    </div>
  );
}
