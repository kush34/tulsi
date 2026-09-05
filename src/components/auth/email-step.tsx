"use client";

import { FormEvent } from "react";

type Props = {
  email: string;
  setEmail: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e?: FormEvent) => void;
  title: string;
  subtitle: string;
  label: string;
  placeholder: string;
  submit: string;
  sending: string;
  info: string;
};

export default function EmailStep(p: Props) {
  return (
    <>
      <div className="text-center">
        <h1 className="text-[28px] font-bold tracking-[-0.8px]">{p.title}</h1>
        <p className="mt-2 text-[14px] leading-5 text-[#8290a5]">{p.subtitle}</p>
      </div>
      <form onSubmit={p.onSubmit} className="mt-8">
        <label htmlFor="email" className="mb-2 block text-[12px] font-medium text-[#475467]">
          {p.label}
        </label>
        <div className="flex h-[50px] overflow-hidden rounded-[9px] border border-[#d9e0ea] bg-white focus-within:border-[#1768d5] focus-within:ring-2 focus-within:ring-[#1768d5]/10">
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={p.email}
            onChange={(e) => p.setEmail(e.target.value)}
            placeholder={p.placeholder}
            className="min-w-0 flex-1 bg-transparent px-4 text-[14px] outline-none placeholder:text-[#a0aabb]"
          />
        </div>
        {p.error && <p className="mt-2 text-[12px] text-red-600">{p.error}</p>}
        <button
          type="submit"
          disabled={p.loading}
          className="mt-5 h-[49px] w-full rounded-[9px] bg-[#1768d5] text-[14px] font-semibold text-white transition hover:bg-[#125bbb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {p.loading ? p.sending : p.submit}
        </button>
      </form>
      <p className="mt-5 text-center text-[11px] leading-4 text-[#8a96a8]">{p.info}</p>
    </>
  );
}
