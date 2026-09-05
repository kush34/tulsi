"use client";

import type { MutableRefObject } from "react";

type Props = {
  value: string[];
  otpRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  onDigit: (index: number, digit: string) => void;
  onBackspace: (index: number) => void;
  onPasteText: (text: string) => void;
};

export default function OtpInput({ value, otpRefs, onDigit, onBackspace, onPasteText }: Props) {
  return (
    <div className="flex justify-center gap-2">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            otpRefs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => onDigit(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[index] && index > 0) onBackspace(index);
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (!text) return;
            e.preventDefault();
            onPasteText(text);
          }}
          onFocus={(e) => e.currentTarget.select()}
          inputMode="numeric"
          maxLength={1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className="h-[52px] w-[45px] rounded-[9px] border border-[#d9e0ea] bg-white text-center text-[20px] font-semibold outline-none transition focus:border-[#1768d5] focus:ring-2 focus:ring-[#1768d5]/10"
        />
      ))}
    </div>
  );
}
