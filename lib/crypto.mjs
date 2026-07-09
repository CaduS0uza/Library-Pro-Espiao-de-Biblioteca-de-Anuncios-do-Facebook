// Cripto reversível das senhas (AES-256-GCM). Chave ENC_KEY só no servidor.
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
const ekey = () => scryptSync(process.env.ENC_KEY || "troque-essa-chave", "libpro-salt-v1", 32);

export function enc(text) {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", ekey(), iv);
  const e = Buffer.concat([c.update(String(text), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), e]).toString("base64");
}
export function dec(b64) {
  try {
    const b = Buffer.from(b64, "base64"), iv = b.subarray(0, 12), tag = b.subarray(12, 28), e = b.subarray(28);
    const d = createDecipheriv("aes-256-gcm", ekey(), iv); d.setAuthTag(tag);
    return Buffer.concat([d.update(e), d.final()]).toString("utf8");
  } catch { return null; }
}
export const verifyPass = (p, stored) => dec(stored) === p;
