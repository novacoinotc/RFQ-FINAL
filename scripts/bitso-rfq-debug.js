// scripts/bitso-rfq-debug.js
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

  console.log("\n=== SIGN DEBUG (RFQ) ===");
  console.log("BASE       :", BASE);
  console.log("METHOD     :", method);
  console.log("PATH       :", path);
  console.log("BODY       :", bodyStr);
  console.log("NONCE      :", nonce);
  console.log("SIGN STRING:", msg);
  console.log("SIGNATURE  :", signature);

  return { Authorization: auth, "Content-Type": "application/json" };
}

async function rfqQuote(payload) {
  const method = "POST";
  const path = "/rfq/v1/quotes";
  const bodyStr = JSON.stringify(payload);
  const headers = authHeaders(method, path, bodyStr);

  const res = await fetch(BASE + path, { method, headers, body: bodyStr });
  const text = await res.text();
  console.log("HTTP:", res.status);
  console.log(text);
}

(async () => {
  // Ajusta a un par válido en tu cuenta; p. ej. BTC/USDT o BTC/MXN según "GET /rfq/v1/pairs"
  await rfqQuote({
    source: "BTC",
    target: "USDT",
    source_amount: "0.001"
  });
})();
