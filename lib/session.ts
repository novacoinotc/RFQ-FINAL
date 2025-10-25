import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev_secret");

export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN"|"CLIENT";
  commissionBps: number;
};

export async function createSessionCookie(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("7d").sign(JWT_SECRET);
  cookies().set("session", token, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
}

export async function clearSessionCookie() {
  cookies().set("session", "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export async function getSessionUser(): Promise<SessionUser> {
  const token = cookies().get("session")?.value;
  if (!token) throw new Error("UNAUTHENTICATED");
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as any as SessionUser;
}

export async function requireAdmin() {
  const u = await getSessionUser();
  if (u.role !== "ADMIN") throw new Error("FORBIDDEN");
  return u;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
