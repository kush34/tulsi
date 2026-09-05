import AssessmentQuestion from "@/components/assesment/AssessmentQuestion";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function AssessmentPage({ params }: Props) {
  const { locale } = await params;

  return <AssessmentQuestion locale={locale} />;
}
