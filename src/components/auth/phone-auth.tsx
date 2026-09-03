"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

import type { Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

type AuthStep = "phone" | "otp";

type PhoneAuthProps = {
  locale: Locale;
};

export default function PhoneAuth({ locale }: PhoneAuthProps) {
  const dictionary = getDictionary(locale);
  const { auth, language } = dictionary;

  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  async function sendOtp(event?: FormEvent) {
    event?.preventDefault();

    setError("");

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      setError(auth.errors.invalidPhone);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: `+91${cleanPhone}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? auth.errors.unableToSend
        );
      }

      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setCountdown(30);

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : auth.errors.somethingWentWrong
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);

    const nextOtp = [...otp];
    nextOtp[index] = digit;

    setOtp(nextOtp);
    setError("");

    if (digit && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();

    const code = otp.join("");

    if (code.length !== 6) {
      setError(auth.errors.invalidOtpLength);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await signIn("credentials", {
        phone: `+91${phone.replace(/\D/g, "")}`,
        otp: code,
        redirect: false,
      });

      if (!result || result.error) {
        setError(auth.errors.invalidOrExpiredOtp);
        return;
      }

      window.location.href = "/assessment";
    } catch {
      setError(auth.errors.unableToVerify);
    } finally {
      setLoading(false);
    }
  }

  function changeNumber() {
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#172033]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-7 sm:px-10 lg:px-12">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div className="flex flex-col leading-none">
            <span className="text-[20px] font-bold tracking-[-0.6px] text-[#1768d5]">
              {auth.brand}
            </span>

            <span className="mt-1 text-[9px] font-medium tracking-[0.2px] text-[#8290a5]">
              {auth.clinicalIntake}
            </span>
          </div>

          <div className="text-[12px] text-[#667085]">
            {language.label}
          </div>
        </header>

        {/* Auth */}
        <section className="flex flex-1 items-center justify-center pb-20">
          <div className="w-full max-w-[430px]">
            <div className="rounded-[18px] bg-white px-7 py-9 shadow-[0_4px_24px_rgba(23,32,51,0.06)] sm:px-10">
              {step === "phone" ? (
                <>
                  <div className="text-center">
                    <h1 className="text-[28px] font-bold tracking-[-0.8px]">
                      {auth.phone.title}
                    </h1>

                    <p className="mt-2 text-[14px] leading-5 text-[#8290a5]">
                      {auth.phone.subtitle}
                    </p>
                  </div>

                  <form
                    onSubmit={sendOtp}
                    className="mt-8"
                  >
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-[12px] font-medium text-[#475467]"
                    >
                      {auth.phone.label}
                    </label>

                    <div className="flex h-[50px] overflow-hidden rounded-[9px] border border-[#d9e0ea] bg-white focus-within:border-[#1768d5] focus-within:ring-2 focus-within:ring-[#1768d5]/10">
                      <div className="flex items-center border-r border-[#e2e6ed] px-4 text-[14px] text-[#475467]">
                        +91
                      </div>

                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(event) =>
                          setPhone(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10)
                          )
                        }
                        placeholder={auth.phone.placeholder}
                        className="min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-[#a0aabb]"
                      />
                    </div>

                    {error && (
                      <p className="mt-2 text-[12px] text-red-600">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        mt-5
                        h-[49px]
                        w-full
                        rounded-[9px]
                        bg-[#1768d5]
                        text-[14px]
                        font-semibold
                        text-white
                        transition
                        hover:bg-[#125bbb]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      {loading
                        ? auth.phone.sendingOtp
                        : auth.phone.continue}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-[11px] leading-4 text-[#8a96a8]">
                    {auth.phone.otpInfo}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <h1 className="text-[28px] font-bold tracking-[-0.8px]">
                      {auth.otp.title}
                    </h1>

                    <p className="mt-2 text-[14px] leading-5 text-[#8290a5]">
                      {auth.otp.subtitle}
                    </p>

                    <p className="mt-1 text-[14px] font-semibold text-[#344054]">
                      +91 {phone}
                    </p>
                  </div>

                  <form
                    onSubmit={verifyOtp}
                    className="mt-8"
                  >
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            otpRefs.current[index] = element;
                          }}
                          value={digit}
                          onChange={(event) =>
                            handleOtpChange(
                              index,
                              event.target.value
                            )
                          }
                          onKeyDown={(event) =>
                            handleOtpKeyDown(index, event)
                          }
                          onFocus={(event) =>
                            event.currentTarget.select()
                          }
                          inputMode="numeric"
                          maxLength={1}
                          autoComplete={
                            index === 0
                              ? "one-time-code"
                              : "off"
                          }
                          className="
                            h-[52px]
                            w-[45px]
                            rounded-[9px]
                            border
                            border-[#d9e0ea]
                            bg-white
                            text-center
                            text-[20px]
                            font-semibold
                            outline-none
                            transition
                            focus:border-[#1768d5]
                            focus:ring-2
                            focus:ring-[#1768d5]/10
                          "
                        />
                      ))}
                    </div>

                    {error && (
                      <p className="mt-3 text-center text-[12px] text-red-600">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        mt-6
                        h-[49px]
                        w-full
                        rounded-[9px]
                        bg-[#1768d5]
                        text-[14px]
                        font-semibold
                        text-white
                        transition
                        hover:bg-[#125bbb]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      {loading
                        ? auth.otp.verifying
                        : auth.otp.verify}
                    </button>
                  </form>

                  <div className="mt-5 flex items-center justify-center gap-1 text-[12px]">
                    <span className="text-[#8a96a8]">
                      {auth.otp.didntReceive}
                    </span>

                    {countdown > 0 ? (
                      <span className="text-[#1768d5]">
                        {auth.otp.resendIn.replace(
                          "{seconds}",
                          String(countdown)
                        )}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendOtp()}
                        disabled={loading}
                        className="font-medium text-[#1768d5] hover:underline disabled:opacity-50"
                      >
                        {auth.otp.resend}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={changeNumber}
                    className="mt-3 block w-full text-center text-[12px] text-[#667085] hover:text-[#1768d5]"
                  >
                    {auth.otp.changeNumber}
                  </button>
                </>
              )}
            </div>

            <p className="mt-5 text-center text-[11px] text-[#98a2b3]">
              {auth.security}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}