// scripts/bitso-auth-debug.js
const crypto = require("crypto");
require("dotenv").config();

const BASE = process.env.BITSO_BASE_URL;
const KEY = process.env.BITSO_API_KEY;
const SECRET = process.env.BITSO_API_SECRET;

function authHeaders(method, path, bodyStr = "") {
  const nonce = Date.now().toString();
  const msg = nonce + method + path + bodyStr;
  const signature = crypto.createHmac("sha256", SECRET).update(msg).digest("hex");
  const auth = `Bitso ${KEY}:${nonce}:${signature}`;

  console.log("\n=== SIGN DEBUG ===");
  console.log("BASE       :", BASE);
  console.log("METHOD     :", method);
  console.log("PATH       :", path);
  console.log("BODY       :", bodyStr);
  console.log("NONCE      :", nonce);
  console.log("SIGN STRING:", msg);
  console.log("SIGNATURE  :", signature);

  return { Authorization: auth, "Content-Type": "application/json" };
}

async function call(method, path, payload) {
  const bodyStr = payload ? JSON.stringify(payload) : "";
  const headers = authHeaders(method, path, bodyStr);
  const res = await fetch(BASE + path, { method, headers, body: bodyStr || undefined });
  const text = await res.text();
  console.log("HTTP:", res.status);
  console.log(text);
}

(async () => {
  // 1) Debe funcionar si las credenciales/permiso "ver información" están OK
  await call("GET", "/v3/account_status/", "");

  // 2) Alternativa simple también autenticada
  await call("GET", "/v3/balance/", "");
})();
