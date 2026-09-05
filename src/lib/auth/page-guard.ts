import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Locale } from "@/i8n/config";
import type { Role } from "@prisma/client";

export async function requirePageSession(locale: Locale, pathname: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/auth?callbackUrl=${encodeURIComponent(pathname)}`);
  }
  return session;
}

export async function requirePageRole(locale: Locale, allowed: Role[], fallbackPath: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/auth`);
  }
  if (!allowed.includes(session.user.role)) {
    redirect(fallbackPath);
  }
  return session;
}
