import { defaultLocale, locales } from "@/i8n/config";

export const AUTH_PATHS = ["/auth", "/login", "/register"];

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/assessment",
  "/document",
  "/confirmation",
  "/profile",
];

export function splitLocale(pathname: string): { locale: string; rest: string } {
  const segments = pathname.split("/");
  const maybeLocale = segments[1] ?? "";
  if ((locales as readonly string[]).includes(maybeLocale)) {
    const rest = `/${segments.slice(2).join("/")}`.replace(/\/$/, "") || "/";
    return { locale: maybeLocale, rest: rest === "" ? "/" : rest };
  }
  return { locale: defaultLocale, rest: pathname };
}

function matches(paths: string[], rest: string): boolean {
  return paths.some((p) => rest === p || rest.startsWith(`${p}/`));
}

export function isAuthPath(rest: string): boolean {
  return matches(AUTH_PATHS, rest);
}

export function isProtectedPath(rest: string): boolean {
  return matches(PROTECTED_PREFIXES, rest);
}

export function isSafeCallbackUrl(value: string | null): boolean {
  if (!value) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  const { rest } = splitLocale(value);
  if (isAuthPath(rest)) return false;
  return true;
}
