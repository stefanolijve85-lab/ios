/** Beheer-authenticatie: wachtwoord uit de omgeving + ondertekende sessiecookie. */
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "bw_beheer";
const MAX_AGE = 60 * 60 * 8;

export function adminConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length >= 12 && (process.env.SESSION_SECRET ?? "").length >= 32;
}
const sign = (v: string) => crypto.createHmac("sha256", process.env.SESSION_SECRET ?? "").update(v).digest("base64url");
function safeEqual(a: string, b: string) {
  const x = crypto.createHash("sha256").update(a).digest(), y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x, y);
}

export function checkPassword(pw: string): boolean {
  return adminConfigured() && safeEqual(pw, process.env.ADMIN_PASSWORD ?? "");
}

export function startSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  cookies().set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE,
  });
}
export function endSession() {
  cookies().delete(COOKIE);
}
export function isAdmin(): boolean {
  if (!adminConfigured()) return false;
  const v = cookies().get(COOKIE)?.value ?? "";
  const [exp, sig] = v.split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}
