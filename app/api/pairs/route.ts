import { NextResponse } from "next/server";
import { bitsoFetch } from "@/lib/bitso";

export async function GET() {
  try {
    const data = await bitsoFetch<any>("GET", "/rfq/v1/pairs");
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { pairs: [{ source: "MXN", target: "USDT" }], error: String(e?.message || e) },
      { status: 200 }
    );
  }
}
