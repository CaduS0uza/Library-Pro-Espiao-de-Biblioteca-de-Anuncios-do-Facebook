// Seletor de banco: usa Supabase se SUPABASE_URL+SERVICE_KEY existirem; senão Netlify Blobs.
// As funções da app importam só daqui — trocar de banco é só setar/limpar as env vars.
import * as supa from "./store-supabase.mjs";
import * as blob from "./store-blobs.mjs";

const B = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) ? supa : blob;
export const BACKEND = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) ? "supabase" : "blobs";

export const ensureAdmin = (...a) => B.ensureAdmin(...a);
export const loginCheck = (...a) => B.loginCheck(...a);
export const listUsersFull = (...a) => B.listUsersFull(...a);
export const addUser = (...a) => B.addUser(...a);
export const delUser = (...a) => B.delUser(...a);
export const setStatus = (...a) => B.setStatus(...a);
export const signup = (...a) => B.signup(...a);
export const getTokens = (...a) => B.getTokens(...a);
export const addToken = (...a) => B.addToken(...a);
export const delToken = (...a) => B.delToken(...a);
export const logSearch = (...a) => B.logSearch(...a);
export const getSearches = (...a) => B.getSearches(...a);
export const countRecentByUser = (...a) => B.countRecentByUser(...a);
export const userExists = (...a) => B.userExists(...a);
export const setPassword = (...a) => B.setPassword(...a);
export const saveResetCode = (...a) => B.saveResetCode(...a);
export const getResetCode = (...a) => B.getResetCode(...a);
export const delResetCode = (...a) => B.delResetCode(...a);

// Valida o header x-auth (base64 "email:senha").
export async function auth(event) {
  await B.ensureAdmin();
  const h = (event.headers && (event.headers["x-auth"] || event.headers["X-Auth"])) || "";
  if (!h) return null;
  let email, pass;
  try { const d = Buffer.from(h, "base64").toString("utf8"); const i = d.indexOf(":"); email = d.slice(0, i); pass = d.slice(i + 1); }
  catch { return null; }
  const u = await B.loginCheck(email, pass);
  return (u && u.status === "ativo") ? { email: u.email, role: u.role } : null; // só ativo acessa
}
