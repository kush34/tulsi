import { notFound } from "next/navigation";

import {
  isRTL,
  isValidLocale,
  locales,
  type Locale,
} from "@/i8n/config";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const direction = isRTL(locale) ? "rtl" : "ltr";

  return (
    <div
      lang={locale}
      dir={direction}
      className="min-h-screen"
    >
      {children}
    </div>
  );
}