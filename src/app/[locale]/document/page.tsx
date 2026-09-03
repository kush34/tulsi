import PatientDocuments from "@/components/document/patient-document";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function DocumentPage({ params }: Props) {
  const { locale } = await params;

  // Replace with your actual patient lookup (session/cookie/db).
  const patientId = "demo-patient-id";

  return <PatientDocuments locale={locale} patientId={patientId} />;
}