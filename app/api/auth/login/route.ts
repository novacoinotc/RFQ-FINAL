import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/crypto";
import { createSessionCookie } from "@/lib/session";

export async function POST(req: Request){
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if(!user) return NextResponse.json({ error:"Invalid" }, { status: 401 });
  const ok = await verifyPassword(password, user.passwordHash);
  if(!ok) return NextResponse.json({ error:"Invalid" }, { status: 401 });

  await createSessionCookie({ id:user.id, email:user.email, role: user.role as any, commissionBps: user.commissionBps });
  return NextResponse.json({ ok: true });
}
