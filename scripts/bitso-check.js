// --- Bitso Check Script (producción) ---
console.log("Bitso API URL:", process.env.BITSO_API_URL);

const crypto = require("crypto");
require("dotenv").config();

const BASE = process.env.BITSO_API_URL; // ✅ corregido: antes decía BITSO_BASE_URL
const KEY = process.env.BITSO_API_KEY;
const SECRET = process.env.BITSO_API_SECRET;

(async () => {
  try {
    const method = "GET";
    const path = "/v3/account_status/"; // ruta correcta
    const body = "";
    const nonce = Date.now().toString();

    const msg = nonce + method + path + body;
    const signature = crypto.createHmac("sha256", SECRET).update(msg).digest("hex");
    const auth = `Bitso ${KEY}:${nonce}:${signature}`;

    const res = await fetch(BASE + path, {
      method,
      headers: { Authorization: auth },
    });

    console.log("HTTP:", res.status);
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error("❌ Error al ejecutar bitso-check:", err);
  }
})();
