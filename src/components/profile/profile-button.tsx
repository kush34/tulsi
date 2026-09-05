import Link from "next/link";
import type { Locale } from "@/i8n/config";

export default function ProfileButton({ locale }: { locale: Locale }) {
  return (
    <Link
      href={`/${locale}/profile`}
      aria-label="Profile"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf3ff] text-[#1768d5] transition hover:bg-[#dbeafe]"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Link>
  );
}
