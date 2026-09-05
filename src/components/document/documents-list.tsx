"use client";

import type { Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";
import { formatBytes } from "./documents-api";
import type { KioskDocument } from "./documents-api";

type Props = {
  locale: Locale;
  documents: KioskDocument[];
};

const DOC_TYPE_LABELS = {
  PRESCRIPTION: "prescription",
  LAB_REPORT: "labReport",
  DISCHARGE_SUMMARY: "dischargeSummary",
  OTHER: "other",
} as const;

export default function DocumentsList({ locale, documents }: Props) {
  const { patientDocuments: dict } = getDictionary(locale);

  return (
    <div>
      <h2 className="mb-3 mt-8 text-[13px] font-semibold text-[#253044]">{dict.documents}</h2>
      {documents.length === 0 ? (
        <p className="rounded-[11px] border border-dashed border-[#cbd5e1] bg-white px-5 py-4 text-[13px] text-[#94a3b8]">
          {dict.recordsEmpty}
        </p>
      ) : (
        <div className="flex max-h-[38vh] flex-col gap-3 overflow-y-auto pr-1">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-[11px] border border-[#e2e8f0] bg-white px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#253044]">{doc.fileName}</p>
                <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                  {new Date(doc.createdAt).toLocaleDateString()} · {formatBytes(doc.sizeBytes)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#eaf3ff] px-3 py-1 text-[11px] font-semibold text-[#1768d5]">
                {dict.docNames[DOC_TYPE_LABELS[doc.docType as keyof typeof DOC_TYPE_LABELS] ?? "other"]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
