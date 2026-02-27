import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const word = req.nextUrl.searchParams.get("word");
  if (!word) {
    return NextResponse.json({ error: "Missing word parameter" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a concise, knowledgeable lexicographer. When given a word, return a JSON object with exactly these fields:

- "word": the word as a string
- "definition": a clear, concise definition (1-2 sentences, plain text only — no markdown formatting)
- "part_of_speech": the primary part of speech (e.g. "noun", "verb", "adjective")
- "pronunciation": the pronunciation key (e.g. "ih-FEM-er-ul")
- "content": a markdown string with two sections:

  First, a flowing explanation with NO header. Weave together the word's etymology (including original language roots in italics), how and when it is used, what distinguishes it from related terms, and natural example usage — all in connected prose paragraphs. Where relevant, explore the word's connection to biblical languages (Hebrew, Greek, Latin), its usage in Scripture or theological discourse, and any spiritual or theological significance. Write in a clear, authoritative but accessible style. Aim for 2-4 paragraphs. Think of this as the explanatory essay a well-read friend would write, not a rigid dictionary entry.

  Then, a "## Related Terms" section with a bullet list of 3-6 related words or concepts. Each bullet MUST be on its own line, separated by newline characters (\\n) in the JSON string. Example format in JSON: "## Related Terms\\n\\n- Word one\\n- Word two\\n- Word three"

IMPORTANT: Only the "content" field should contain markdown. All other fields (word, definition, part_of_speech, pronunciation) must be plain text with no markdown formatting whatsoever.

Return ONLY valid JSON. No markdown fences, no explanation outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Define the word: "${word}"`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);

    // Append programmatic source links
    const w = parsed.word || word;
    const wLower = w.toLowerCase();
    const wEncoded = encodeURIComponent(w);
    const sources = [
      `- [Logos Factbook](https://ref.ly/logos4/Factbook?id=ref%3abk.%25${wEncoded}&lens=all)`,
      `- [Anchor Yale Bible Dictionary](https://ref.ly/logosres/anch?hw=${wEncoded})`,
      `- [Lexham Bible Dictionary](https://ref.ly/logosres/lbd?hw=${wEncoded})`,
    ].join("\n");

    const content = parsed.content
      ? `${parsed.content}\n\n## Sources\n\n${sources}`
      : "";

    return NextResponse.json({
      word: parsed.word || word,
      definition: parsed.definition || "",
      part_of_speech: parsed.part_of_speech || "",
      pronunciation: parsed.pronunciation || null,
      content,
    });
  } catch (err) {
    const errorMessage = err instanceof SyntaxError
      ? "Failed to parse AI response"
      : "AI lookup failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
