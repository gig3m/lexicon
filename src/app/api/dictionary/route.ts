import { NextRequest, NextResponse } from "next/server";
import type { MWDefinition } from "@/lib/types";

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word");

  if (!word) {
    return NextResponse.json({ error: "Missing word parameter" }, { status: 400 });
  }

  const apiKey = process.env.MW_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "MW API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${apiKey}`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "MW API request failed" }, { status: 502 });
    }

    const data = await res.json();

    // If MW returns an array of strings, those are suggestions (word not found)
    if (data.length > 0 && typeof data[0] === "string") {
      return NextResponse.json({ suggestions: data, definitions: [] });
    }

    // Parse MW response into our format
    const definitions: MWDefinition[] = [];

    for (const entry of data) {
      if (!entry.meta?.id || !entry.shortdef?.length) continue;

      // Clean the headword (MW appends :1, :2, etc. for homographs)
      const headword = entry.meta.id.replace(/:.*$/, "");

      // Only include entries that match the searched word
      if (headword.toLowerCase() !== word.toLowerCase()) continue;

      const pronunciation = entry.hwi?.prs?.[0]?.mw || null;

      definitions.push({
        word: headword,
        partOfSpeech: entry.fl || "unknown",
        definitions: entry.shortdef,
        ...(pronunciation && { pronunciation }),
      });
    }

    return NextResponse.json({ definitions, suggestions: [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch definitions" }, { status: 500 });
  }
}
