import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "voicebot_session";

const DEFAULT_SECRET = "change-me-in-production";

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || DEFAULT_SECRET;
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "demo",
  };
}

export function verifyCredentials(username: string, password: string): boolean {
  const admin = getAdminCredentials();
  return username === admin.username && password === admin.password;
}

function sign(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

export function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const signature = sign(payload);
  return Buffer.from(JSON.stringify({ payload, signature })).toString(
    "base64url",
  );
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  try {
    const { payload, signature } = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8"),
    ) as { payload: string; signature: string };

    const expected = sign(payload);
    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return false;
    }

    const { exp } = JSON.parse(payload) as { exp: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
