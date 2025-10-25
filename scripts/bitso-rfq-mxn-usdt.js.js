require("dotenv").config();
const crypto = require("crypto");

const BASE = process.env.BITSO_API_URL;
const KEY = process.env.BITSO_API_KEY;
const SECRET = process.env.BITSO_API_SECRET;

(async () => {
  const method = "POST";
  const path = "/rfq/v1/quotes";

  // 💰 Par MXN → USDT
  // Usa el monto en MXN que quieras convertir a USDT
  const body = JSON.stringify({
    source: "MXN",
    target: "USDT",
    source_amount: "100000" // puedes subirlo, por ejemplo 50000 o 100000
  });

  const nonce = Date.now().toString();
  const msg = nonce + method + path + body;
  const signature = crypto.createHmac("sha256", SECRET).update(msg).digest("hex");
  const auth = `Bitso ${KEY}:${nonce}:${signature}`;

  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: auth,
      "Content-Type": "application/json"
    },
    body
  });

  console.log("HTTP:", res.status);
  console.log(await res.text());
})();
