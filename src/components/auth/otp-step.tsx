"use client";

import { FormEvent } from "react";
import OtpInput from "@/components/auth/otp-input";
import type { useEmailOtp } from "@/components/auth/use-email-otp";

type OtpState = ReturnType<typeof useEmailOtp>;

type Props = {
  state: OtpState;
  onResend: () => void;
};

export default function OtpStep({ state, onResend }: Props) {
  const { dict } = state;

  function handleDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...state.otp];
    next[index] = digit;
    state.setOtp(next);
    if (digit && index < state.otp.length - 1) state.otpRefs.current[index + 1]?.focus();
  }

  function handlePaste(raw: string) {
    const text = raw.replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    state.setOtp(next);
    state.otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  function submit(e: FormEvent) {
    void state.verifyOtp(e);
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-[28px] font-bold tracking-[-0.8px]">{dict.otp.title}</h1>
        <p className="mt-2 text-[14px] leading-5 text-[#8290a5]">{dict.otp.subtitle}</p>
        <p className="mt-1 text-[14px] font-semibold text-[#344054]">{state.email}</p>
      </div>
      <form onSubmit={submit} className="mt-8">
        <OtpInput
          value={state.otp}
          otpRefs={state.otpRefs}
          onDigit={handleDigit}
          onBackspace={(i) => state.otpRefs.current[i - 1]?.focus()}
          onPasteText={handlePaste}
        />
        {state.error && (
          <p className="mt-3 text-center text-[12px] text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={state.loading}
          className="mt-6 h-[49px] w-full rounded-[9px] bg-[#1768d5] text-[14px] font-semibold text-white transition hover:bg-[#125bbb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.loading ? dict.otp.verifying : dict.otp.verify}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-center gap-1 text-[12px]">
        <span className="text-[#8a96a8]">{dict.otp.didntReceive}</span>
        {state.countdown > 0 ? (
          <span className="text-[#1768d5]">
            {dict.otp.resendIn.replace("{seconds}", String(state.countdown))}
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={state.loading}
            className="font-medium text-[#1768d5] hover:underline disabled:opacity-50"
          >
            {dict.otp.resend}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={state.changeEmail}
        className="mt-3 block w-full text-center text-[12px] text-[#667085] hover:text-[#1768d5]"
      >
        {dict.otp.changeNumber}
      </button>
    </>
  );
}
