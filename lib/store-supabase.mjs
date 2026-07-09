// Backend Supabase. service_role só no servidor; RLS bloqueia o resto.
import { createClient } from "@supabase/supabase-js";
import { enc, dec, verifyPass } from "./crypto.mjs";

let _sb;
function sb() {
  if (!_sb) {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("Supabase não configurado.");
    _sb = createClient(url, key, { auth: { persistSession: false } });
  }
  return _sb;
}

export async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase(), pass = process.env.ADMIN_PASS || "";
  if (!email || !pass) return;
  const { data } = await sb().from("app_users").select("email").eq("email", email).maybeSingle();
  if (!data) await sb().from("app_users").insert({ email, pass_enc: enc(pass), role: "admin" });
}
async function getUserByEmail(email) {
  const { data } = await sb().from("app_users").select("*").eq("email", String(email).toLowerCase()).maybeSingle();
  return data;
}
export async function loginCheck(email, pass) {
  const u = await getUserByEmail(email);
  if (!u || !verifyPass(pass, u.pass_enc)) return null;
  return { email: u.email, role: u.role, status: u.status || "ativo" };
}
export async function listUsersFull() {
  const { data } = await sb().from("app_users").select("email,pass_enc,role,status,created_at").order("created_at");
  return (data || []).map(u => ({ email: u.email, senha: dec(u.pass_enc), role: u.role, status: u.status || "ativo", created_at: u.created_at }));
}
export const addUser = (email, pass, role, status) =>
  sb().from("app_users").insert({ email: String(email).toLowerCase(), pass_enc: enc(pass), role: role || "user", status: status || "ativo" });
export const delUser = (email) => sb().from("app_users").delete().eq("email", String(email).toLowerCase());
export const setStatus = (email, status) => sb().from("app_users").update({ status }).eq("email", String(email).toLowerCase());
export async function signup(email, pass) {
  email = String(email).toLowerCase();
  if (await getUserByEmail(email)) throw new Error("Email já cadastrado.");
  // cadastro entra já ATIVO — loga automático, sem aprovação do admin
  await sb().from("app_users").insert({ email, pass_enc: enc(pass), role: "user", status: "ativo" });
}

export async function getTokens() {
  let { data } = await sb().from("apify_tokens").select("*").order("created_at");
  if (!data || !data.length) {
    let seed = []; try { seed = JSON.parse(process.env.APIFY_TOKENS || "[]"); } catch {}
    if (!seed.length && process.env.APIFY_TOKEN) seed = [{ label: "Token 1", token: process.env.APIFY_TOKEN }];
    if (seed.length) {
      await sb().from("apify_tokens").insert(seed.map((s, i) => ({ id: "t" + (i + 1), label: s.label || ("Token " + (i + 1)), token: s.token })));
      ({ data } = await sb().from("apify_tokens").select("*").order("created_at"));
    }
  }
  return data || [];
}
export const addToken = (label, token) => sb().from("apify_tokens").insert({ id: "t" + Date.now(), label, token });
export const delToken = (id) => sb().from("apify_tokens").delete().eq("id", id);

export async function userExists(email) { return !!(await getUserByEmail(email)); }
export const setPassword = (email, pass) => sb().from("app_users").update({ pass_enc: enc(pass) }).eq("email", String(email).toLowerCase());
export const saveResetCode = (email, code, expiresAt) =>
  sb().from("reset_codes").upsert({ email: String(email).toLowerCase(), code, expires_at: expiresAt });
export async function getResetCode(email) {
  const { data } = await sb().from("reset_codes").select("*").eq("email", String(email).toLowerCase()).maybeSingle();
  return data;
}
export const delResetCode = (email) => sb().from("reset_codes").delete().eq("email", String(email).toLowerCase());

export const logSearch = (e) => sb().from("searches").insert(e);
export async function getSearches(limit = 300) {
  const { data } = await sb().from("searches").select("*").order("ts", { ascending: false }).limit(limit);
  return data || [];
}
export async function countRecentByUser(email, sinceMs) {
  const since = new Date(Date.now() - sinceMs).toISOString();
  const { count } = await sb().from("searches").select("id", { count: "exact", head: true }).eq("email", email).gte("ts", since);
  return count || 0;
}
