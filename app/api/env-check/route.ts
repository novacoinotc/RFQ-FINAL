import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.BITSO_BASE_URL || "";
  const key = process.env.BITSO_API_KEY || "";
  return NextResponse.json({
    BITSO_BASE_URL: base,
    BITSO_API_KEY_preview: key ? key.slice(0,4) + "…" + key.slice(-4) : "",
  });
}
