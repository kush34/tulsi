"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import type { Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

export type AuthStep = "email" | "otp";

type Options = { locale: Locale; callbackUrl?: string };

function safeRedirect(target: string | undefined, fallback: string): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) return target;
  return fallback;
}

export function useEmailOtp({ locale, callbackUrl }: Options) {
  const { auth } = getDictionary(locale);
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  function message(data: unknown, fallback: string): string {
    if (typeof data === "object" && data !== null && "error" in data) {
      const err = (data as { error: unknown }).error;
      if (typeof err === "string") return err;
      if (typeof err === "object" && err !== null && "message" in err) {
        const msg = (err as { message: unknown }).message;
        if (typeof msg === "string") return msg;
      }
    }
    return fallback;
  }

  async function sendOtp(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    const normalized = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError(auth.errors.invalidEmail);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(message(data, auth.errors.unableToSend));
      setEmail(normalized);
      if (typeof data === "object" && data !== null && "devCode" in data) {
        console.info("[dev] OTP code:", (data as { devCode: unknown }).devCode);
      }
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : auth.errors.somethingWentWrong);
    } finally {
      setLoading(false);
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
      const result = await signIn("email-otp", { email, otp: code, redirect: false });
      if (!result || result.error) {
        setError(auth.errors.invalidOrExpiredOtp);
        return;
      }
      window.location.href = safeRedirect(callbackUrl, `/${locale}/assesment`);
    } catch {
      setError(auth.errors.unableToVerify);
    } finally {
      setLoading(false);
    }
  }

  function changeEmail() {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  }

  return {
    dict: auth,
    step,
    email,
    setEmail: (v: string) => {
      setEmail(v);
      setError("");
    },
    otp,
    setOtp,
    loading,
    error,
    countdown,
    otpRefs,
    sendOtp,
    verifyOtp,
    changeEmail,
  };
}
