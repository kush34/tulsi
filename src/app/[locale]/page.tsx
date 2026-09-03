import { notFound } from "next/navigation";

import WelcomeScreen from "@/components/welcome/welcome-screen";
import {
  isValidLocale,
  locales,
  type Locale,
} from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <WelcomeScreen
      locale={locale as Locale}
      dictionary={dictionary}
    />
  );
}