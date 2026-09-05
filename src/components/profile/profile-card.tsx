"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

type Props = {
  locale: Locale;
  name: string | null;
  email: string;
  role: string;
};

export default function ProfileCard({ locale, name, email, role }: Props) {
  const dictionary = getDictionary(locale);
  const { profile: dict } = dictionary;
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error(dict.signOutError);
      router.push(`/${locale}/auth`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.signOutError);
      setSigningOut(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 text-[13px] font-medium text-[#64748b] hover:text-[#1768d5]"
      >
        ← {dict.back}
      </button>

      <div className="rounded-[18px] bg-white px-8 py-9 shadow-[0_4px_24px_rgba(23,32,51,0.06)]">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf3ff] text-[22px] font-bold text-[#1768d5]">
            {(name ?? email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[18px] font-semibold text-[#172033]">{name ?? email}</p>
            <p className="truncate text-[13px] text-[#64748b]">{email}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-[12px] bg-[#f8fafc] px-4 py-3">
          <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#94a3b8]">
            {dict.role}
          </span>
          <span className="rounded-full bg-[#eaf3ff] px-3 py-1 text-[12px] font-semibold text-[#1768d5]">
            {role}
          </span>
        </div>

        {error && <p className="mt-4 text-[12px] text-red-600">{error}</p>}

        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="mt-6 h-[46px] w-full rounded-[9px] border border-red-200 bg-white text-[14px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? dict.signingOut : dict.signOut}
        </button>
      </div>
    </div>
  );
}
