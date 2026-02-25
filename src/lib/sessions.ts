import { randomBytes, createHmac } from "crypto";

const SECRET = process.env.ADMIN_PASSWORD! + "_lexicon_session_secret";

export function createSession(): string {
  const nonce = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", SECRET).update(nonce).digest("hex");
  return `${nonce}.${signature}`;
}

export function validateSession(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [nonce, signature] = parts;
  const expected = createHmac("sha256", SECRET).update(nonce).digest("hex");
  return signature === expected;
}
