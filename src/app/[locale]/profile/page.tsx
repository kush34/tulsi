import { requirePageSession } from "@/lib/auth/page-guard";
import ProfileCard from "@/components/profile/profile-card";
import { getDictionary } from "@/i8n/dictionaries";
import type { Locale } from "@/i8n/config";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const session = await requirePageSession(locale, `/${locale}/profile`);
  const { auth } = getDictionary(locale);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-10 text-[#172033]">
      <p className="mb-6 text-center text-[20px] font-bold tracking-[-0.6px] text-[#1768d5]">
        {auth.brand}
      </p>
      <ProfileCard
        locale={locale}
        name={session.user.name ?? null}
        email={session.user.email ?? ""}
        role={session.user.role}
      />
    </main>
  );
}
