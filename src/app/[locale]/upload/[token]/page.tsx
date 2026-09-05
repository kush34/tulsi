import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/i8n/config";
import { resolveUploadToken } from "@/lib/documents/upload-tokens";
import PhoneUploadForm from "@/components/upload/phone-upload-form";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function UploadPage({ params }: Props) {
  const { locale, token } = await params;
  if (!isValidLocale(locale)) notFound();

  const grant = await resolveUploadToken(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-10 text-[#172033]">
      <div className="w-full max-w-[430px]">
        <PhoneUploadForm locale={locale as Locale} token={token} valid={!!grant} />
      </div>
    </main>
  );
}
