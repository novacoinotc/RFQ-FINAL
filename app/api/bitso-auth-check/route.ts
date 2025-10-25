// app/api/bitso-auth-check/route.ts
import { NextResponse } from "next/server";
import { bitsoFetch } from "@/lib/bitso";

export async function GET() {
  try {
    // endpoint privado simple de v3 para comprobar firma/entorno
    const data = await bitsoFetch<any>("GET", "/v3/account_status");
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 401 });
  }
}
