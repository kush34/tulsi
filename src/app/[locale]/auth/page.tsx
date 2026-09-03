import PhoneAuth from "@/components/auth/phone-auth";
import type { Locale } from "@/i8n/config"; 

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;

  return <PhoneAuth locale={locale} />;
}