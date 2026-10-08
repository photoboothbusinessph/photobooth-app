import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "photobooth-admin-session";
export const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 8;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Server environment is not configured.");
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(adminId: string, version: number) {
  return new SignJWT({ version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  if (!payload.sub || typeof payload.version !== "number") throw new Error("Unauthorized");
  return { adminId: payload.sub, version: payload.version };
}
