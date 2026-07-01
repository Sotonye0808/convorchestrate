import { createHmac, timingSafeEqual } from "crypto"

/**
 * Validates an incoming Meta webhook request using HMAC-SHA256 signature.
 * Returns true if the signature is valid.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader) return false
  if (!appSecret) return false

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")

  const prefix = "sha256="
  const actual = signatureHeader.startsWith(prefix)
    ? signatureHeader.slice(prefix.length)
    : signatureHeader

  if (expected.length !== actual.length) return false

  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(actual, "utf8"))
  } catch {
    return false
  }
}

/**
 * Verifies the Meta webhook challenge (GET request).
 * Returns the challenge string if mode, token, and challenge are valid.
 */
export function verifyWebhookChallenge(
  mode: string | undefined,
  verifyToken: string | undefined,
  challenge: string | undefined,
  expectedToken: string,
): string | null {
  if (mode === "subscribe" && verifyToken === expectedToken && challenge) {
    return challenge
  }
  return null
}
