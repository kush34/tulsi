"use client";

import { useState } from "react";
import type { Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

const DOC_TYPES = [
  { value: "PRESCRIPTION", label: "prescription" },
  { value: "LAB_REPORT", label: "labReport" },
  { value: "DISCHARGE_SUMMARY", label: "dischargeSummary" },
  { value: "OTHER", label: "other" },
] as const;

type Props = {
  locale: Locale;
  token: string;
  valid: boolean;
};

export default function PhoneUploadForm({ locale, token, valid }: Props) {
  const dictionary = getDictionary(locale);
  const { patientDocuments: dict } = dictionary;
  const phone = dict.phone;

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("OTHER");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!valid) {
    return (
      <div className="rounded-[18px] bg-white px-7 py-9 text-center shadow-[0_4px_24px_rgba(23,32,51,0.06)]">
        <h1 className="text-[22px] font-semibold text-[#172033]">{phone.invalidTitle}</h1>
        <p className="mt-2 text-[14px] text-[#64748b]">{phone.invalidBody}</p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("docType", docType);
      const res = await fetch(`/api/v1/upload/${token}/files`, { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof body?.error === "string"
            ? body.error
            : (body?.error as { message?: string } | undefined)?.message;
        throw new Error(msg ?? phone.genericError);
      }
      setDone(true);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : phone.genericError);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-[18px] bg-white px-7 py-9 shadow-[0_4px_24px_rgba(23,32,51,0.06)]">
      <h1 className="text-center text-[22px] font-semibold text-[#172033]">{phone.title}</h1>
      <p className="mt-2 text-center text-[14px] text-[#64748b]">{phone.subtitle}</p>

      {done && (
        <p className="mt-4 rounded-[9px] bg-green-50 px-4 py-3 text-center text-[13px] font-medium text-green-800">
          {phone.success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="block">
          <span className="mb-2 block text-[12px] font-medium text-[#475467]">{phone.chooseFile}</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setDone(false);
              setError("");
            }}
            className="w-full text-[13px] text-[#253044]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[12px] font-medium text-[#475467]">{phone.docType}</span>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-[46px] w-full rounded-[9px] border border-[#dfe5ec] bg-white px-4 text-[14px] outline-none focus:border-[#1768d5]"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {phone.types[t.label]}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-[12px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!file || uploading}
          className="h-[49px] w-full rounded-[9px] bg-[#1768d5] text-[14px] font-semibold text-white transition hover:bg-[#125bbb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? phone.uploading : done ? phone.uploadAnother : phone.upload}
        </button>
      </form>
    </div>
  );
}
