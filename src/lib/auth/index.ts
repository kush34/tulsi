import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/db";
import { recordAuditEvent } from "@/lib/auth/notifications";
import { consumeEmailOtp, OtpVerifyError } from "@/lib/auth/email-otp-service";
import { rateLimit } from "@/lib/auth/rate-limiter";
import type { Role } from "@prisma/client";
import { config } from "@/lib/config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Credentials({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email as string | undefined;
        const rawOtp = credentials?.otp as string | undefined;
        if (!rawEmail || !rawOtp) return null;

        const throttle = rateLimit(
          `OTP_VERIFY:${rawEmail.trim().toLowerCase()}`,
          10,
          15 * 60 * 1000,
        );
        if (!throttle.success) return null;

        let email: string;
        try {
          email = await consumeEmailOtp(rawEmail, rawOtp);
        } catch (err) {
          if (err instanceof OtpVerifyError) return null;
          throw err;
        }

        let user = await db.user.findUnique({ where: { email } });
        if (!user) {
          user = await db.user.create({
            data: { email, isActive: true, isVerified: true, role: "PATIENT" },
          });
        }
        if (!user.isActive) return null;
        if (!user.isVerified) {
          await db.user.update({
            where: { id: user.id },
            data: { isVerified: true },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role as Role) ?? "PATIENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async signIn({ user }) {
      if (user.id) {
        await recordAuditEvent({
          userId: user.id as string,
          event: "AUTH.SIGN_IN",
          metadata: { provider: "email-otp" },
        });
      }
      return true;
    },
  },
  secret: config.auth.secret,
  debug: config.app.isDev,
});
