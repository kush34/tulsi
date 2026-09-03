import DoctorDashboard from "@/components/dashboard/dashbord";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function DoctorDashboardPage({ params }: Props) {
  const { locale } = await params;

  // Replace with your actual queue/patient lookup.
  const queue = [
    { id: "1042", name: "Rajesh Kumar" },
    { id: "1043", name: "Sunita Sharma" },
    { id: "1044", name: "Amit Patel" },
    { id: "1045", name: "Priya Shah" },
  ];

  const patient = {
    id: "1042",
    name: "Rajesh Kumar",
    age: 54,
    sex: "M" as const,
    department: "General Medicine",
    alert: "Chest pain + breathlessness",
    chiefComplaint: "Chest pain × 2 days",
    historyOfPresentIllness:
      "Intermittent central chest pressure; exertional; associated breathlessness.",
    pastHistory: "Diabetes × 5 years · Hypertension × 8 years",
    medications: "Metformin 500 mg · Amlodipine 5 mg",
    investigations: "HbA1c 8.2% · Creatinine 1.8 mg/dL",
  };

  return <DoctorDashboard locale={locale} queue={queue} patient={patient} />;
}