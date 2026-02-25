import { NextRequest, NextResponse } from "next/server";
import { createSession, validateSession, deleteSession } from "@/lib/sessions";

const COOKIE_OPTIONS = "HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (token && validateSession(token)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Logout
  if (body.logout) {
    const token = req.cookies.get("admin_token")?.value;
    if (token) deleteSession(token);
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", "admin_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
    return res;
  }

  // Login
  if (body.password === process.env.ADMIN_PASSWORD) {
    const token = createSession();
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", `admin_token=${token}; ${COOKIE_OPTIONS}`);
    return res;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
