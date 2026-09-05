import PatientDocuments from "@/components/document/patient-document";
import { requirePageSession } from "@/lib/auth/page-guard";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function DocumentPage({ params }: Props) {
  const { locale } = await params;
  await requirePageSession(locale, `/${locale}/document`);

  return <PatientDocuments locale={locale} />;
}
