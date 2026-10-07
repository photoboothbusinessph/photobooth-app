import "server-only";
import { randomBytes } from "node:crypto";

export function createTemporaryPassword() {
  return randomBytes(18).toString("base64url");
}
