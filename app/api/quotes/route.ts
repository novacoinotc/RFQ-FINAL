import { NextResponse } from "next/server";
import crypto from "crypto";
import { bitsoFetch } from "@/lib/bitso";

const PATH = "/rfq/v1/quotes";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function precisionFor(currency: string): number {
  const c = currency.toUpperCase();
  if (c === "MXN" || c === "USD") return 2;
  if (c === "USDT") return 6;
  if (c === "BTC" || c === "ETH") return 8;
  return 6;
}

function roundTo(n: number, p: number) {
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}

function parseBitsoErrorMessage(e: any) {
  const s = String(e?.message || e || "");
  const m = s.match(/{.*}/s);
  if (m) {
    try {
      const j = JSON.parse(m[0]);
      return (
        j?.error?.message ||
        (Array.isArray(j?.errors) && j.errors[0]?.message) ||
        s
      );
    } catch {}
  }
  return s;
}

async function requestRFQ(body: any) {
  // 1 intento + backoff si hay "Too many requests"
  for (let i = 0; i < 2; i++) {
    try {
      return await bitsoFetch<any>("POST", PATH, body);
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (/too\s+many\s+requests/i.test(msg) && i === 0) {
        await sleep(900);
        continue;
      }
      throw err;
    }
  }
}

function normalizeQuote(q: any) {
  const createdAt = new Date().toISOString();

  // expires_at real de Bitso (puede ser ~30s)
  const expiresAt =
    q?.expires_at && !Number.isNaN(Date.parse(q.expires_at))
      ? q.expires_at
      : new Date(Date.now() + (q?.ttl_ms ?? 30_000)).toISOString();

  // Para UI: forzamos recotizar cada 4s
  const clientExpiresAt = new Date(Date.now() + 4_000).toISOString();

  const srcAmt = Number(
    q?.source_amount ??
      q?.amount_source ??
      q?.from_amount ??
      q?.base_amount ??
      q?.source?.amount ??
      0
  );
  const tgtAmt = Number(
    q?.target_amount ??
      q?.amount_target ??
      q?.to_amount ??
      q?.counter_amount ??
      q?.target?.amount ??
      0
  );

  let rate = Number(q?.rate ?? q?.price ?? q?.fx_rate ?? 0);
  if (!rate && srcAmt > 0 && tgtAmt > 0) {
    // Convención Bitso: rate es source:target
    rate = srcAmt / tgtAmt;
  }

  return {
    id: crypto.randomUUID(),               // folio interno provisional (para UI si lo necesitas)
    bitso_quote_id: q?.id ?? q?.quote_id ?? "",
    source: q?.source ?? "MXN",
    target: q?.target ?? "USDT",
    source_amount: srcAmt,
    target_amount: tgtAmt,
    rate,
    status: q?.status ?? "ACTIVE",
    created_at: createdAt,
    expires_at: expiresAt,                 // real de Bitso
    client_expires_at: clientExpiresAt     // 4s para recotizar en UI
  };
}

export async function POST(req: Request) {
  try {
    // Solo aceptamos monto en MXN y siempre BUY MXN -> USDT (tu etapa actual)
    const { amount } = await req.json();
    const amtRaw = Number(amount || 0);
    if (!Number.isFinite(amtRaw) || amtRaw <= 0) {
      return NextResponse.json(
        { error: "Monto inválido. Ingresa un número positivo." },
        { status: 400 }
      );
    }

    const src = "MXN";
    const tgt = "USDT";
    const precSrc = precisionFor(src);
    let source_amount = roundTo(amtRaw, precSrc);

    // Intento principal con source_amount (MXN)
    try {
      const body = {
        side: "BUY",                    // fijo: compra USDT con MXN
        source_currency: src,
        target_currency: tgt,
        source_amount: source_amount.toString()
      };
      const r = await requestRFQ(body);
      const q = r?.data ?? r?.quote ?? r ?? {};
      return NextResponse.json(normalizeQuote(q), { status: 200 });
    } catch (e1: any) {
      const msg1 = parseBitsoErrorMessage(e1);
      // Reintento por precisión si aplica
      if (/precision|number_format|provided amount|both_amounts_missing/i.test(msg1)) {
        source_amount = roundTo(source_amount, precSrc);
        try {
          const body = {
            side: "BUY",
            source_currency: src,
            target_currency: tgt,
            source_amount: source_amount.toString()
          };
          const r2 = await requestRFQ(body);
          const q2 = r2?.data ?? r2?.quote ?? r2 ?? {};
          return NextResponse.json(normalizeQuote(q2), { status: 200 });
        } catch (e1b: any) {
          // si también falla, devolvemos el mensaje claro
          return NextResponse.json({ error: parseBitsoErrorMessage(e1b) }, { status: 400 });
        }
      }
      return NextResponse.json({ error: msg1 }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message || err) },
      { status: 400 }
    );
  }
}
