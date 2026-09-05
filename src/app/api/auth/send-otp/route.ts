import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/auth/rate-limit-route";
import { sendOtp } from "@/lib/auth/notifications";
import {
  OtpRequestError,
  requestEmailOtp,
} from "@/lib/auth/email-otp-service";
import { config } from "@/lib/config";

const bodySchema = z.object({ email: z.string().min(1) });

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "OTP_REQUEST");
  if (limited) return limited;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  let email: string;
  let code: string;
  try {
    ({ email, code } = await requestEmailOtp(parsed.data.email));
  } catch (err) {
    if (err instanceof OtpRequestError) {
      const status = err.code === "RESEND_TOO_SOON" ? 429 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }

  try {
    await sendOtp(email, code, "LOGIN");
  } catch {
    return NextResponse.json(
      { error: "Unable to send OTP. Please try again." },
      { status: 502 },
    );
  }

  if (config.app.isDev) {
    return NextResponse.json({ success: true, devCode: code });
  }
  return NextResponse.json({ success: true });
}
