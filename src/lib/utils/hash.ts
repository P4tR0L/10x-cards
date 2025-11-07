/**
 * Hash utility for generating SHA-256 hashes
 * Used for privacy-preserving storage of source texts
 *
 * Uses Web Crypto API which works in both Node.js and Cloudflare Workers
 */

/**
 * Generates a SHA-256 hash from the given text
 * @param text - The text to hash
 * @returns Hexadecimal string representation of the hash
 */
export async function hashText(text: string): Promise<string> {
  // Use Web Crypto API (works in both Node.js 18+ and Cloudflare Workers)
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
