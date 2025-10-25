import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { hashPassword } from "@/lib/crypto";

export async function POST(req: Request){
  try { await requireAdmin(); } catch { return NextResponse.json({ error:"FORBIDDEN" }, { status: 403 }); }
  const { email, name, password, commissionBps } = await req.json();
  const user = await prisma.user.create({
    data: {
      email, name, role: "CLIENT",
      passwordHash: await hashPassword(password),
      commissionBps: Number(commissionBps ?? 0)
    }
  });
  return NextResponse.json({ id: user.id });
}

export async function PATCH(req: Request){
  try { await requireAdmin(); } catch { return NextResponse.json({ error:"FORBIDDEN" }, { status: 403 }); }
  const { id, commissionBps, password } = await req.json();
  const data: any = {};
  if(commissionBps != null) data.commissionBps = Number(commissionBps);
  if(password) data.passwordHash = await hashPassword(password);
  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ ok: true, id: user.id });
}
