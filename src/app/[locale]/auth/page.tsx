import EmailAuth from "@/components/auth/email-auth";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function AuthPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const search = await searchParams;

  return <EmailAuth locale={locale} callbackUrl={search?.callbackUrl} />;
}
