import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bitsoFetch } from "@/lib/bitso";
import crypto from "crypto";
import { getSessionUser } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: { id: string } }){
  try { await getSessionUser(); } catch { return NextResponse.json({ error:"Auth requerida" }, { status: 401 }); }
  const quote = await prisma.quote.findUnique({ where: { id: params.id } });
  if(!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if(quote.expiresAt.getTime() <= Date.now()) return NextResponse.json({ error: "Quote expired" }, { status: 410 });

  const convert = await bitsoFetch<any>("POST", `/rfq/v1/quotes/${quote.bitsoQuoteId}/convert`, {});

  const folio = "OTC-" + new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14) + "-" +
    crypto.randomBytes(3).toString("hex").upper();

  const conv = await prisma.conversion.create({
    data: {
      quoteId: quote.id, userId: quote.userId,
      bitsoConversionId: convert.id, folio,
      status: "AWAITING_PAYMENT"
    }
  });
  await prisma.quote.update({ where: { id: quote.id }, data: { status: "CONVERTED" } });

  return NextResponse.json({ folio: conv.folio, status: conv.status, conversion_id: convert.id });
}
