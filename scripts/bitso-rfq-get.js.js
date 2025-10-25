require("dotenv").config();
const crypto = require("crypto");

const BASE = process.env.BITSO_API_URL;
const KEY = process.env.BITSO_API_KEY;
const SECRET = process.env.BITSO_API_SECRET;

// ⚠️ Reemplaza este ID por el que te dio el POST anterior
const QUOTE_ID = "1771c812-788f-4cac-8aec-d32842cab2f6";

(async () => {
  const method = "GET";
  const path = `/rfq/v1/quotes/${QUOTE_ID}`;
  const body = "";
  const nonce = Date.now().toString();

  const msg = nonce + method + path + body;
  const signature = crypto.createHmac("sha256", SECRET).update(msg).digest("hex");
  const auth = `Bitso ${KEY}:${nonce}:${signature}`;

  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: auth }
  });

  console.log("HTTP:", res.status);
  console.log(await res.text());
})();
