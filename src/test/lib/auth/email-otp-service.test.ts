import { beforeEach, describe, expect, it } from "vitest";
import { OTP_TTL_MS } from "@/lib/auth/email-otp";
import {
  OtpRequestError,
  OtpVerifyError,
  consumeEmailOtp,
  requestEmailOtp,
} from "@/lib/auth/email-otp-service";

type Token = { identifier: string; token: string; expires: Date };

function createFakeDb() {
  const tokens: Token[] = [];
  return {
    tokens,
    verificationToken: {
      async findFirst(args: {
        where: { identifier: string; token?: string };
        orderBy?: { expires: string };
      }): Promise<Token | null> {
        const matches = tokens.filter(
          (t) =>
            t.identifier === args.where.identifier &&
            (args.where.token === undefined || t.token === args.where.token),
        );
        if (args.orderBy) {
          matches.sort((a, b) => b.expires.getTime() - a.expires.getTime());
        }
        return matches[0] ?? null;
      },
      async deleteMany(args: { where: { identifier: string } }) {
        const before = tokens.length;
        for (let i = tokens.length - 1; i >= 0; i--) {
          if (tokens[i].identifier === args.where.identifier) tokens.splice(i, 1);
        }
        return { count: before - tokens.length };
      },
      async create(args: { data: Token }) {
        tokens.push({ ...args.data });
        return args.data;
      },
      async delete(args: {
        where: { identifier_token: { identifier: string; token: string } };
      }) {
        const index = tokens.findIndex(
          (t) =>
            t.identifier === args.where.identifier_token.identifier &&
            t.token === args.where.identifier_token.token,
        );
        if (index === -1) throw new Error("not found");
        const [removed] = tokens.splice(index, 1);
        return removed;
      },
    },
  };
}

describe("email-otp-service", () => {
  let fake: ReturnType<typeof createFakeDb>;

  beforeEach(() => {
    fake = createFakeDb();
  });

  it("rejects invalid email on request", async () => {
    await expect(
      requestEmailOtp("not-an-email", fake as never),
    ).rejects.toMatchObject({ code: "INVALID_EMAIL" });
    await expect(requestEmailOtp("", fake as never)).rejects.toBeInstanceOf(
      OtpRequestError,
    );
    expect(fake.tokens).toHaveLength(0);
  });

  it("stores a normalized identifier", async () => {
    const { email, code } = await requestEmailOtp(
      "  User@Example.COM ",
      fake as never,
    );
    expect(email).toBe("user@example.com");
    expect(code).toMatch(/^\d{6}$/);
    expect(fake.tokens[0].identifier).toBe("user@example.com");
  });

  it("enforces resend cooldown", async () => {
    await requestEmailOtp("user@example.com", fake as never);
    await expect(requestEmailOtp("user@example.com", fake as never)).rejects.toMatchObject({
      code: "RESEND_TOO_SOON",
    });
  });

  it("allows re-request once the previous code expired", async () => {
    await requestEmailOtp("user@example.com", fake as never);
    fake.tokens[0].expires = new Date(Date.now() - OTP_TTL_MS - 1000);
    const second = await requestEmailOtp("user@example.com", fake as never);
    expect(second.code).toMatch(/^\d{6}$/);
    expect(fake.tokens).toHaveLength(1);
  });

  it("consumes a valid code once", async () => {
    const { code } = await requestEmailOtp("user@example.com", fake as never);
    const email = await consumeEmailOtp("USER@example.com", ` ${code} `, fake as never);
    expect(email).toBe("user@example.com");
    await expect(
      consumeEmailOtp("user@example.com", code, fake as never),
    ).rejects.toBeInstanceOf(OtpVerifyError);
  });

  it("rejects wrong codes", async () => {
    await requestEmailOtp("user@example.com", fake as never);
    await expect(
      consumeEmailOtp("user@example.com", "000000", fake as never),
    ).rejects.toMatchObject({ code: "INVALID_OR_EXPIRED" });
  });

  it("rejects expired codes", async () => {
    const { code } = await requestEmailOtp("user@example.com", fake as never);
    fake.tokens[0].expires = new Date(Date.now() - 1000);
    await expect(
      consumeEmailOtp("user@example.com", code, fake as never),
    ).rejects.toMatchObject({ code: "INVALID_OR_EXPIRED" });
  });

  it("rejects malformed input without touching storage", async () => {
    await expect(consumeEmailOtp("bad-email", "123456", fake as never)).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
    await expect(consumeEmailOtp("user@example.com", "123", fake as never)).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
    await expect(consumeEmailOtp("", "", fake as never)).rejects.toBeInstanceOf(OtpVerifyError);
  });
});
