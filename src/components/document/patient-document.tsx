"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { isRTL, type Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

type DocumentStatus = "processed" | "processing";

type DocumentItem = {
  key: "prescription" | "labReport" | "dischargeSummary";
  status: DocumentStatus;
};

type PatientDocumentsProps = {
  locale: Locale;
  patientId: string;
};

const documents: DocumentItem[] = [
  { key: "prescription", status: "processed" },
  { key: "labReport", status: "processed" },
  { key: "dischargeSummary", status: "processing" },
];

export default function PatientDocuments({ locale, patientId }: PatientDocumentsProps) {
  const dictionary = getDictionary(locale);
  const { patientDocuments: dict } = dictionary;

  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${patientId}`;

    QRCode.toDataURL(uploadUrl, {
      margin: 1,
      width: 220,
    })
      .then(setQrDataUrl)
      .catch((error) => {
        console.error("Failed to generate QR code:", error);
      });
  }, [patientId]);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-[#172033]"
      dir={isRTL(locale) ? "rtl" : "ltr"}
    >
      {/* =========================================================
          PASTEL AI EDGE GLOW
          ========================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute -left-32 -top-32
            h-80 w-80
            rounded-full
            bg-[#93c5fd]/25
            blur-3xl
            animate-pulse
          "
        />
        <div
          className="
            absolute -right-32 -top-20
            h-80 w-80
            rounded-full
            bg-[#c4b5fd]/25
            blur-3xl
            animate-pulse
          "
        />
        <div
          className="
            absolute -bottom-40 -left-20
            h-96 w-96
            rounded-full
            bg-[#f9a8d4]/20
            blur-3xl
            animate-pulse
          "
        />
        <div
          className="
            absolute -bottom-32 -right-32
            h-96 w-96
            rounded-full
            bg-[#67e8f9]/20
            blur-3xl
            animate-pulse
          "
        />
        <div
          className="
            absolute inset-0
            opacity-50
            blur-2xl
            bg-[linear-gradient(90deg,rgba(147,197,253,0.15),transparent_18%,transparent_82%,rgba(196,181,253,0.15))]
          "
        />
      </div>

      {/* =========================================================
          CONTENT
          ========================================================= */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-8 sm:px-10 lg:px-12">

        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center justify-between">
            <div className="text-[20px] font-semibold tracking-[-0.02em] text-[#1768d5]">
              {dictionary.auth.brand}
            </div>

            <div className="text-[12px] font-medium text-[#64748b]">
              {dict.breadcrumb}
            </div>
          </div>
        </header>

        {/* Main content */}
        <section className="flex flex-1 flex-col justify-start pt-10 sm:pt-14 lg:pt-16">
          <div className="mx-auto w-full max-w-[1080px]">

            {/* Title */}
            <div className="mb-7">
              <h1 className="text-[27px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#172033] sm:text-[30px]">
                {dict.title}
              </h1>
              <p className="mt-2 text-[13px] text-[#718096]">
                {dict.subtitle}
              </p>
            </div>

            {/* Content grid: left = upload flow, right = QR panel */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px]">

              {/* =================================================
                  LEFT: UPLOAD FLOW
                  ================================================= */}

              <div className="flex flex-col">

                {/* Scan / upload cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="
                      rounded-[13px]
                      border
                      border-[#bfdbfe]
                      bg-[#eaf3ff]
                      p-5
                      text-left
                      transition-all
                      duration-200
                      hover:border-[#93c5fd]
                    "
                  >
                    <span className="block text-[14px] font-semibold text-[#1768d5]">
                      {dict.scanDocument}
                    </span>
                    <span className="mt-1 block text-[12px] text-[#64748b]">
                      {dict.scanDocumentHint}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="
                      rounded-[13px]
                      border
                      border-[#e2e8f0]
                      bg-white
                      p-5
                      text-left
                      transition-all
                      duration-200
                      hover:border-[#b8c9df]
                    "
                  >
                    <span className="block text-[14px] font-semibold text-[#253044]">
                      {dict.uploadFile}
                    </span>
                    <span className="mt-1 block text-[12px] text-[#64748b]">
                      {dict.uploadFileHint}
                    </span>
                  </button>
                </div>

                {/* Documents list */}
                <h2 className="mt-8 mb-3 text-[13px] font-semibold text-[#253044]">
                  {dict.documents}
                </h2>

                <div className="flex flex-col gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.key}
                      className="
                        flex
                        items-center
                        justify-between
                        rounded-[11px]
                        border
                        border-[#e2e8f0]
                        bg-white
                        px-5
                        py-4
                      "
                    >
                      <span className="text-[13px] font-medium text-[#253044]">
                        {dict.docNames[doc.key]}
                      </span>
                      <span
                        className={`text-[12px] font-medium ${
                          doc.status === "processed"
                            ? "text-[#16a34a]"
                            : "text-[#94a3b8]"
                        }`}
                      >
                        {doc.status === "processed"
                          ? dict.statusProcessed
                          : dict.statusProcessing}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Continue */}
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    className="
                      h-[46px]
                      min-w-[130px]
                      rounded-[9px]
                      bg-[#1768d5]
                      px-6
                      text-[13px]
                      font-semibold
                      text-white
                      shadow-[0_5px_15px_rgba(23,104,213,0.18)]
                      transition-all
                      hover:bg-[#155fc3]
                    "
                  >
                    {dict.continue}
                  </button>
                </div>
              </div>

              {/* =================================================
                  RIGHT: QR PANEL
                  ================================================= */}

              <div
                className="
                  flex
                  h-fit
                  flex-col
                  items-center
                  rounded-[13px]
                  border
                  border-[#e2e8f0]
                  bg-white
                  p-6
                  text-center
                "
              >
                <span className="text-[13px] font-semibold text-[#253044]">
                  {dict.qrTitle}
                </span>
                <span className="mt-1 text-[12px] text-[#718096]">
                  {dict.qrHint}
                </span>

                <div className="mt-5 flex h-[176px] w-[176px] items-center justify-center rounded-[11px] border border-[#e2e8f0] bg-[#f8fafc]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={dict.qrTitle}
                      className="h-[160px] w-[160px]"
                    />
                  ) : (
                    <div className="h-[160px] w-[160px] animate-pulse rounded-[9px] bg-[#e2e8f0]" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}