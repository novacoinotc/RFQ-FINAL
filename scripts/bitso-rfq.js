import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const BITSO_API_KEY = process.env.BITSO_API_KEY;
const BITSO_API_SECRET = process.env.BITSO_API_SECRET;
const BITSO_BASE_URL = process.env.BITSO_BASE_URL;

async function requestQuote() {
  const path = "/rfq/v1/quotes";
  const url = `${BITSO_BASE_URL}${path}`;
  const nonce = Date.now() * 1000; // importante usar microsegundos
  const method = "POST";

  const body = JSON.stringify({
    source: "MXN",
    target: "USDT",
    source_amount: "100000"
  });

  // 🔐 Firma HMAC-SHA256 (orden exacto)
  const message = `${nonce}${method}${path}${body}`;
  const signature = crypto
    .createHmac("sha256", BITSO_API_SECRET)
    .update(message)
    .digest("hex");

  const headers = {
    "Authorization": `Bitso ${BITSO_API_KEY}:${signature}:${nonce}`,
    "Content-Type": "application/json"
  };

  const response = await fetch(url, {
    method,
    headers,
    body
  });

  const data = await response.json();
  console.log("Respuesta:", data);
}

requestQuote().catch(console.error);
