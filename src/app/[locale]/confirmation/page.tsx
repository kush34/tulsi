import ConfirmationSummary from "@/components/confirmation/confirmaton-summary";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function ConfirmationPage({ params }: Props) {
  const { locale } = await params;

  // Replace with your actual assessment/session lookup.
  const summary = {
    mainProblem: "Chest pain for 2 days",
    medicalConditions: "Diabetes · Hypertension",
    medicines: "Amlodipine 5 mg · Metformin 500 mg",
    documentsCount: 4,
  };

  return <ConfirmationSummary locale={locale} summary={summary} />;
}