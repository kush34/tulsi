"use client";

import Link from "next/link";
import { isRTL, type Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";
import DocumentsList from "./documents-list";
import UploadQr from "./upload-qr";
import { useDocumentUpload } from "./use-document-upload";

export default function PatientDocuments({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { patientDocuments: dict } = dictionary;
  const { status, token, documents, error } = useDocumentUpload();
  const nextHref = `/${locale}/confirmation`;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-[#172033]"
      dir={isRTL(locale) ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#93c5fd]/25 blur-3xl animate-pulse" />
        <div className="absolute -right-32 -top-20 h-80 w-80 rounded-full bg-[#c4b5fd]/25 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[#f9a8d4]/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#67e8f9]/20 blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="mb-5">
          <div className="flex items-center justify-between">
            <div className="text-[20px] font-semibold tracking-[-0.02em] text-[#1768d5]">
              {dictionary.auth.brand}
            </div>
            <div className="text-[12px] font-medium text-[#64748b]">{dict.breadcrumb}</div>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-start pt-10 sm:pt-14 lg:pt-16">
          <div className="mx-auto w-full max-w-[1080px]">
            <div className="mb-7">
              <h1 className="text-[27px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#172033] sm:text-[30px]">
                {dict.title}
              </h1>
              <p className="mt-2 text-[13px] text-[#718096]">{dict.subtitle}</p>
            </div>

            {status === "loading" && (
              <p className="text-[14px] text-[#64748b]">{dict.statusProcessing}</p>
            )}

            {status === "error" && (
              <div className="rounded-[13px] border border-[#e2e8f0] bg-white px-5 py-4">
                <p className="text-[14px] text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 text-[13px] font-semibold text-[#1768d5] hover:text-[#155fc3]"
                >
                  {dict.continue}
                </button>
              </div>
            )}

            {status === "ready" && (
              <>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px]">
                  <div className="flex min-w-0 flex-col">
                    <DocumentsList locale={locale} documents={documents} />
                    <div className="mt-8 flex items-center justify-between gap-4">
                      <Link
                        href={nextHref}
                        className="text-[13px] font-medium text-[#64748b] hover:text-[#1768d5]"
                      >
                        {dict.skip}
                      </Link>
                      <Link
                        href={nextHref}
                        className="h-[46px] min-w-[130px] rounded-[9px] bg-[#1768d5] px-6 text-center text-[13px] font-semibold leading-[46px] text-white shadow-[0_5px_15px_rgba(23,104,213,0.18)] transition-all hover:bg-[#155fc3]"
                      >
                        {dict.continue}
                      </Link>
                    </div>
                  </div>
                  <UploadQr locale={locale} token={token} />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
