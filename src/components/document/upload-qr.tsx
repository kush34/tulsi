"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

type Props = {
  locale: Locale;
  token: string;
};

export default function UploadQr({ locale, token }: Props) {
  const { patientDocuments: dict } = getDictionary(locale);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    const uploadUrl = `${window.location.origin}/${locale}/upload/${token}`;
    QRCode.toDataURL(uploadUrl, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch((error: unknown) => {
        console.error("Failed to generate QR code:", error);
      });
  }, [token, locale]);

  return (
    <div className="flex h-fit flex-col items-center rounded-[13px] border border-[#e2e8f0] bg-white p-6 text-center">
      <span className="text-[13px] font-semibold text-[#253044]">{dict.qrTitle}</span>
      <span className="mt-1 text-[12px] text-[#718096]">{dict.qrHint}</span>
      <div className="mt-5 flex h-[176px] w-[176px] items-center justify-center rounded-[11px] border border-[#e2e8f0] bg-[#f8fafc]">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={dict.qrTitle} className="h-[160px] w-[160px]" />
        ) : (
          <div className="h-[160px] w-[160px] animate-pulse rounded-[9px] bg-[#e2e8f0]" />
        )}
      </div>
    </div>
  );
}
