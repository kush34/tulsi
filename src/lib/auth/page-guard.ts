import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Locale } from "@/i8n/config";

export async function requirePageSession(locale: Locale, pathname: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/auth?callbackUrl=${encodeURIComponent(pathname)}`);
  }
  return session;
}
