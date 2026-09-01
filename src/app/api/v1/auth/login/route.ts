import { NextRequest } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { validate } from "@/lib/validators";
import { loginSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { checkRateLimit } from "@/lib/auth/rate-limit-route";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, "LOGIN");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const input = validate(loginSchema, body);

    try {
      await signIn("credentials", {
        email: input.email,
        password: input.password,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        throw new UnauthorizedError("Invalid email or password");
      }
      throw error;
    }

    return successResponse({ message: "Signed in successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}