import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getCollections } from "@/lib/db/collections";
import { getBusinessBySlug } from "@/lib/db/tenant";
import { getServerEnvironment } from "@/lib/server/env";

const KIOSK_COOKIE = "photobooth-kiosk";

export function hashKioskSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function newKioskSecret() {
  return randomBytes(32).toString("base64url");
}

export async function setKioskCookie(token: string) {
  (await cookies()).set(KIOSK_COOKIE, token, {
    httpOnly: true,
    secure: getServerEnvironment().NEXT_PUBLIC_APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function requireKiosk(slug: string) {
  const business = await getBusinessBySlug(slug);
  if (!business) throw new Error("Forbidden");
  const token = (await cookies()).get(KIOSK_COOKIE)?.value;
  if (!token) throw new Error("Unauthorized");
  const { kioskDevices } = await getCollections();
  const device = await kioskDevices.findOne({ tokenHash: hashKioskSecret(token), businessId: business._id, isEnabled: true });
  if (!device) throw new Error("Forbidden");
  await kioskDevices.updateOne({ _id: device._id }, { $set: { lastSeenAt: new Date() } });
  return { businessId: business._id, deviceId: device._id };
}
