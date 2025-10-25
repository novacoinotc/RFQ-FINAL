import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(){
  try { await requireAdmin(); } catch { return NextResponse.json([], { status: 200 }); }
  const list = await prisma.user.findMany({ select: { id:true, email:true, name:true, role:true, commissionBps:true } });
  return NextResponse.json(list);
}
