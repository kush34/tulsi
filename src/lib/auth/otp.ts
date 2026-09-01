import crypto from "crypto";
import { hashPassword } from "./password";

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function hashOtp(code: string): Promise<string> {
  return hashPassword(code);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  const { verifyPassword } = await import("./password");
  return verifyPassword(code, hash);
}
