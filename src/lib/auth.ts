import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "./sessions";

export function requireAuth(req: NextRequest): NextResponse | null {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CSRF: check Origin header on mutating requests
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("host");
    const originHost = new URL(origin).host;
    if (host && originHost !== host) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return null;
}
