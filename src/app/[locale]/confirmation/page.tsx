import ConfirmationSummary from "@/components/confirmation/confirmaton-summary";
import { requirePageSession } from "@/lib/auth/page-guard";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function ConfirmationPage({ params }: Props) {
  const { locale } = await params;
  await requirePageSession(locale, `/${locale}/confirmation`);

  return <ConfirmationSummary locale={locale} />;
}
