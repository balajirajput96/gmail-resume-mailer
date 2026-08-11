import crypto from "crypto";
import { ENV } from "./_core/env";

const TOKEN_PREFIX = "v1";

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("Server security configuration is unavailable");
  return crypto.createHash("sha256").update(`gmail-token:${ENV.cookieSecret}`).digest();
}

export function encryptServerSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [TOKEN_PREFIX, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptServerSecret(payload: string) {
  const [version, ivValue, tagValue, ciphertext] = payload.split(".");
  if (version !== TOKEN_PREFIX || !ivValue || !tagValue || !ciphertext) throw new Error("Stored credential format is invalid");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

export function signValue(value: string) {
  return crypto.createHmac("sha256", encryptionKey()).update(value).digest("base64url");
}

export function hasValidSignature(value: string, signature: string) {
  const expectedBuffer = Buffer.from(signValue(value));
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

