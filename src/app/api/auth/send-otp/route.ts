import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone = body.phone;

    if (
      typeof phone !== "string" ||
      !/^\+91\d{10}$/.test(phone)
    ) {
      return NextResponse.json(
        {
          error: "Invalid mobile number.",
        },
        { status: 400 }
      );
    }

    /*
     * IMPORTANT:
     *
     * Do NOT generate the OTP in the browser.
     *
     * Production flow:
     *
     * 1. Generate cryptographically secure OTP
     * 2. Hash OTP
     * 3. Store hash in Redis
     * 4. Set 5-minute expiry
     * 5. Rate limit phone/IP
     * 6. Send OTP through SMS provider
     */

    console.log(`Send OTP to ${phone}`);

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to send OTP.",
      },
      { status: 500 }
    );
  }
}