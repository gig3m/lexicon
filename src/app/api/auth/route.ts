import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function makeToken(password: string): string {
  return createHash("sha256").update(password + "_lexicon_salt").digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Verify by token (session check)
  if (body.token) {
    const expected = makeToken(process.env.ADMIN_PASSWORD!);
    if (body.token === expected) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Verify by password (login)
  if (body.password === process.env.ADMIN_PASSWORD) {
    const token = makeToken(body.password);
    return NextResponse.json({ ok: true, token });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
