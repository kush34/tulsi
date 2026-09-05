import AssessmentQuestion from "@/components/assesment/AssessmentQuestion";
import { requirePageSession } from "@/lib/auth/page-guard";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function AssessmentPage({ params }: Props) {
  const { locale } = await params;
  await requirePageSession(locale, `/${locale}/assesment`);

  return (
    <AssessmentQuestion
      locale={locale}
      step={3}
      totalSteps={6}
    />
  );
}   