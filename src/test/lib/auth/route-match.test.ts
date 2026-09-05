import { describe, expect, it } from "vitest";
import {
  isAuthPath,
  isProtectedPath,
  isSafeCallbackUrl,
  splitLocale,
} from "@/lib/auth/route-match";

describe("splitLocale", () => {
  it("splits a known locale prefix", () => {
    expect(splitLocale("/en/dashboard")).toEqual({ locale: "en", rest: "/dashboard" });
    expect(splitLocale("/hi/auth")).toEqual({ locale: "hi", rest: "/auth" });
  });

  it("falls back to default locale without prefix", () => {
    expect(splitLocale("/dashboard")).toEqual({ locale: "en", rest: "/dashboard" });
    expect(splitLocale("/")).toEqual({ locale: "en", rest: "/" });
  });

  it("handles trailing slash and empty input", () => {
    expect(splitLocale("/en/dashboard/")).toEqual({ locale: "en", rest: "/dashboard" });
    expect(splitLocale("")).toEqual({ locale: "en", rest: "" });
  });
});

describe("isAuthPath", () => {
  it("matches auth pages and nested paths", () => {
    expect(isAuthPath("/auth")).toBe(true);
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/auth/verify")).toBe(true);
  });

  it("rejects protected and public paths", () => {
    expect(isAuthPath("/dashboard")).toBe(false);
    expect(isAuthPath("/")).toBe(false);
    expect(isAuthPath("/authenticate")).toBe(false);
  });
});

describe("isProtectedPath", () => {
  it("matches all protected sections", () => {
    for (const p of ["/dashboard", "/assesment", "/assessment", "/document", "/confirmation"]) {
      expect(isProtectedPath(p)).toBe(true);
      expect(isProtectedPath(`${p}/123`)).toBe(true);
    }
  });

  it("rejects auth, welcome, and lookalikes", () => {
    expect(isProtectedPath("/auth")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/documents")).toBe(false);
    expect(isProtectedPath("")).toBe(false);
  });
});

describe("isSafeCallbackUrl", () => {
  it("accepts relative protected paths", () => {
    expect(isSafeCallbackUrl("/en/dashboard")).toBe(true);
    expect(isSafeCallbackUrl("/dashboard")).toBe(true);
  });

  it("rejects open redirects and auth loops", () => {
    expect(isSafeCallbackUrl(null)).toBe(false);
    expect(isSafeCallbackUrl("")).toBe(false);
    expect(isSafeCallbackUrl("https://evil.com")).toBe(false);
    expect(isSafeCallbackUrl("//evil.com")).toBe(false);
    expect(isSafeCallbackUrl("/en/auth")).toBe(false);
  });
});
