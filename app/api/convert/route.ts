import { NextResponse } from "next/server";
import { bitsoFetch } from "@/lib/bitso";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const PATH = "/rfq/v1/conversions";

// Folio interno legible (OTC-AAAAMMDD-HHMMSS-XXXX)
function makeFolio() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mi = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const rnd = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `OTC-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rnd}`;
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

export async function POST(req: Request) {
  try {
    const { quote_id } = await req.json();

    if (!quote_id || typeof quote_id !== "string") {
      return NextResponse.json(
        { error: "quote_id es requerido" },
        { status: 400 }
      );
    }

    // Ejecuta conversión en Bitso
    const body = { quote_id };
    const res = await bitsoFetch<any>("POST", PATH, body);
    const conv = res?.data ?? res?.conversion ?? res ?? {};

    // Normaliza campos
    const source = String(conv?.source ?? "");
    const target = String(conv?.target ?? "");
    const source_amount = Number(conv?.source_amount ?? 0);
    const target_amount = Number(conv?.target_amount ?? 0);
    const rate = Number(
      conv?.rate ?? (source_amount > 0 && target_amount > 0 ? source_amount / target_amount : 0)
    );
    const status = String(conv?.status ?? "PENDING");
    const bitsoConversionId = String(conv?.id ?? "");

    // Genera folio interno
    const folio = makeFolio();

    // Guarda log en base (Prisma)
    try {
      await prisma.conversionLog.create({
        data: {
          folio,
          quoteId: quote_id,
          bitsoConversion: bitsoConversionId || null,
          source,
          target,
          sourceAmount: isNaN(source_amount) ? 0 : source_amount,
          targetAmount: isNaN(target_amount) ? 0 : target_amount,
          rate: isNaN(rate) ? 0 : rate,
          status
        }
      });
    } catch (dbErr) {
      // No bloqueamos la respuesta al cliente si falla el log;
      // solo lo registramos en server para inspección.
      console.error("❗ Error guardando ConversionLog:", dbErr);
    }

    // Respuesta normalizada + folio interno
    return NextResponse.json(
      {
        folio,
        bitso_conversion_id: bitsoConversionId,
        quote_id,
        source,
        target,
        source_amount,
        target_amount,
        rate,
        status,
        created_at: conv?.created_at ?? new Date().toISOString(),
        updated_at: conv?.updated_at ?? null
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: parseBitsoErrorMessage(err) },
      { status: 400 }
    );
  }
}
