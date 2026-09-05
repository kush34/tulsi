"use client";

import type { Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";
import { useEmailOtp } from "@/components/auth/use-email-otp";
import EmailStep from "@/components/auth/email-step";
import OtpStep from "@/components/auth/otp-step";

type Props = { locale: Locale; callbackUrl?: string };

export default function EmailAuth({ locale, callbackUrl }: Props) {
  const { language } = getDictionary(locale);
  const state = useEmailOtp({ locale, callbackUrl });
  const { dict } = state;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#172033]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-7 sm:px-10 lg:px-12">
        <header className="flex items-start justify-between">
          <div className="flex flex-col leading-none">
            <span className="text-[20px] font-bold tracking-[-0.6px] text-[#1768d5]">
              {dict.brand}
            </span>
            <span className="mt-1 text-[9px] font-medium tracking-[0.2px] text-[#8290a5]">
              {dict.clinicalIntake}
            </span>
          </div>
          <div className="text-[12px] text-[#667085]">{language.label}</div>
        </header>
        <section className="flex flex-1 items-center justify-center pb-20">
          <div className="w-full max-w-[430px]">
            <div className="rounded-[18px] bg-white px-7 py-9 shadow-[0_4px_24px_rgba(23,32,51,0.06)] sm:px-10">
              {state.step === "email" ? (
                <EmailStep
                  email={state.email}
                  setEmail={state.setEmail}
                  error={state.error}
                  loading={state.loading}
                  onSubmit={(e) => void state.sendOtp(e)}
                  title={dict.email.title}
                  subtitle={dict.email.subtitle}
                  label={dict.email.label}
                  placeholder={dict.email.placeholder}
                  submit={dict.email.continue}
                  sending={dict.email.sendingOtp}
                  info={dict.email.otpInfo}
                />
              ) : (
                <OtpStep state={state} onResend={() => void state.sendOtp()} />
              )}
            </div>
            <p className="mt-5 text-center text-[11px] text-[#98a2b3]">{dict.security}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
