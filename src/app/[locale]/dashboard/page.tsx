import { Role } from "@prisma/client";
import DoctorDashboard from "@/components/dashboard/dashboard";
import { requirePageRole } from "@/lib/auth/page-guard";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function DoctorDashboardPage({ params }: Props) {
  const { locale } = await params;
  await requirePageRole(locale, [Role.DOCTOR, Role.ADMIN], `/${locale}/assessment`);

  return <DoctorDashboard locale={locale} />;
}
