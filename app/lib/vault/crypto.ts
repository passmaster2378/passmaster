import crypto from "crypto";

type EncryptedPayload = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string; // base64
  ct: string; // base64
  tag: string; // base64
};

function getKey() {
  const raw = process.env.VAULT_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "VAULT_ENCRYPTION_KEY is missing. Set it in .env.local / Vercel Environment Variables.",
    );
  }

  // Prefer base64 (recommended). Fall back to utf-8 for quick local testing.
  const key = raw.includes("=") || raw.length >= 40 ? Buffer.from(raw, "base64") : Buffer.from(raw);
  if (key.length !== 32) {
    throw new Error(
      `VAULT_ENCRYPTION_KEY must be 32 bytes (base64-encoded recommended). Got ${key.length} bytes.`,
    );
  }
  return key;
}

export function encryptSecret(plaintext: string) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    ct: ct.toString("base64"),
    tag: tag.toString("base64"),
  };

  return JSON.stringify(payload);
}

export function decryptSecret(payloadJson: string) {
  const key = getKey();
  const parsed = JSON.parse(payloadJson) as EncryptedPayload;
  if (parsed?.v !== 1 || parsed?.alg !== "aes-256-gcm") {
    throw new Error("Unknown encrypted payload format.");
  }

  const iv = Buffer.from(parsed.iv, "base64");
  const ct = Buffer.from(parsed.ct, "base64");
  const tag = Buffer.from(parsed.tag, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

