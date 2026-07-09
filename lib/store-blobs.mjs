// Backend Netlify Blobs (banco embutido, zero credencial). Mesma interface do Supabase.
import { getStore } from "@netlify/blobs";
import { enc, dec, verifyPass } from "./crypto.mjs";

const store = () => getStore("libpro");
async function getJSON(key, fb) { try { const v = await store().get(key, { type: "json" }); return v ?? fb; } catch { return fb; } }
const setJSON = (k, v) => store().setJSON(k, v);

export async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase(), pass = process.env.ADMIN_PASS || "";
  if (!email || !pass) return;
  const users = await getJSON("users", []);
  if (!users.find(u => u.email === email)) {
    users.push({ email, pass_enc: enc(pass), role: "admin", created_at: new Date().toISOString() });
    await setJSON("users", users);
  }
}
export async function loginCheck(email, pass) {
  const users = await getJSON("users", []);
  const u = users.find(x => x.email === String(email).toLowerCase());
  if (!u || !verifyPass(pass, u.pass_enc)) return null;
  return { email: u.email, role: u.role, status: u.status || "ativo" };
}
export async function listUsersFull() {
  const users = await getJSON("users", []);
  return users.map(u => ({ email: u.email, senha: dec(u.pass_enc), role: u.role, status: u.status || "ativo", created_at: u.created_at }));
}
export async function addUser(email, pass, role, status) {
  const users = await getJSON("users", []); email = String(email).toLowerCase();
  if (users.find(u => u.email === email)) throw new Error("Usuário já existe.");
  users.push({ email, pass_enc: enc(pass), role: role || "user", status: status || "ativo", created_at: new Date().toISOString() });
  await setJSON("users", users);
}
export async function delUser(email) {
  email = String(email).toLowerCase();
  await setJSON("users", (await getJSON("users", [])).filter(u => u.email !== email));
}
export async function setStatus(email, status) {
  email = String(email).toLowerCase();
  const users = await getJSON("users", []);
  const u = users.find(x => x.email === email); if (u) { u.status = status; await setJSON("users", users); }
}
export async function signup(email, pass) {
  email = String(email).toLowerCase();
  const users = await getJSON("users", []);
  if (users.find(u => u.email === email)) throw new Error("Email já cadastrado.");
  // cadastro entra já ATIVO — loga automático, sem aprovação do admin
  users.push({ email, pass_enc: enc(pass), role: "user", status: "ativo", created_at: new Date().toISOString() });
  await setJSON("users", users);
}

export async function getTokens() {
  let t = await getJSON("tokens", null);
  if (!t || !t.length) {
    let seed = []; try { seed = JSON.parse(process.env.APIFY_TOKENS || "[]"); } catch {}
    if (!seed.length && process.env.APIFY_TOKEN) seed = [{ label: "Token 1", token: process.env.APIFY_TOKEN }];
    t = seed.map((s, i) => ({ id: "t" + (i + 1), label: s.label || ("Token " + (i + 1)), token: s.token, created_at: new Date().toISOString() }));
    await setJSON("tokens", t);
  }
  return t;
}
export async function addToken(label, token) {
  const t = await getJSON("tokens", []);
  t.push({ id: "t" + Date.now(), label: label || "Token", token, created_at: new Date().toISOString() });
  await setJSON("tokens", t);
}
export async function delToken(id) {
  await setJSON("tokens", (await getJSON("tokens", [])).filter(x => x.id !== id));
}

export async function userExists(email) {
  return (await getJSON("users", [])).some(u => u.email === String(email).toLowerCase());
}
export async function setPassword(email, pass) {
  email = String(email).toLowerCase();
  const users = await getJSON("users", []);
  const u = users.find(x => x.email === email); if (u) { u.pass_enc = enc(pass); await setJSON("users", users); }
}
export async function saveResetCode(email, code, expiresAt) {
  const m = await getJSON("resets", {}); m[String(email).toLowerCase()] = { code, expires_at: expiresAt }; await setJSON("resets", m);
}
export async function getResetCode(email) {
  const r = (await getJSON("resets", {}))[String(email).toLowerCase()];
  return r ? { email: String(email).toLowerCase(), ...r } : null;
}
export async function delResetCode(email) {
  const m = await getJSON("resets", {}); delete m[String(email).toLowerCase()]; await setJSON("resets", m);
}

export async function logSearch(e) {
  const list = await getJSON("searches", []);
  list.unshift({ ...e, ts: new Date().toISOString() });
  await setJSON("searches", list.slice(0, 800));
}
export const getSearches = (limit = 300) => getJSON("searches", []).then(l => l.slice(0, limit));
export async function countRecentByUser(email, sinceMs) {
  const since = Date.now() - sinceMs;
  return (await getJSON("searches", [])).filter(s => s.email === email && new Date(s.ts).getTime() >= since).length;
}
