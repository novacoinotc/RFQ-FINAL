// lib/bitso.ts
import crypto from "crypto";

type Method = "GET" | "POST" | "DELETE";

const BASE = process.env.BITSO_BASE_URL || "https://api.bitso.com";
const KEY = process.env.BITSO_API_KEY || "";
const SECRET = process.env.BITSO_API_SECRET || "";

export async function bitsoFetch<T = any>(
  method: Method,
  path: string,
  body?: Record<string, any>
): Promise<T> {
  if (!KEY || !SECRET) {
    throw new Error("Faltan BITSO_API_KEY o BITSO_API_SECRET en .env");
  }

  const nonce = Date.now().toString();
  const requestPath = path.startsWith("/") ? path : `/${path}`;
  const payload = body ? JSON.stringify(body) : "";
  const message = nonce + method + requestPath + payload;
  const signature = crypto.createHmac("sha256", SECRET).update(message).digest("hex");

  const res = await fetch(`${BASE}${requestPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Bitso-Api-Key": KEY,
      "Bitso-Nonce": nonce,
      "Bitso-Signature": signature
    },
    body: method === "POST" ? payload : undefined,
    cache: "no-store"
  });

  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : undefined; } catch {}
  if (!res.ok) throw new Error(`Bitso ${res.status}: ${text || res.statusText}`);
  return (json ?? (text as any)) as T;
}
