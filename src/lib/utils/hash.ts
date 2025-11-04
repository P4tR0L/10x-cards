/**
 * Hash utility for generating SHA-256 hashes
 * Used for privacy-preserving storage of source texts
 */

import crypto from "crypto";

/**
 * Generates a SHA-256 hash from the given text
 * @param text - The text to hash
 * @returns Hexadecimal string representation of the hash
 */
export function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}
