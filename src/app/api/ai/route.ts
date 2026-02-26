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
- "definition": a clear, concise definition (1-2 sentences)
- "part_of_speech": the primary part of speech (e.g. "noun", "verb", "adjective")
- "pronunciation": the pronunciation key (e.g. "ih-FEM-er-ul")
- "content": a markdown string with these sections:
  ## Etymology
  Brief origin of the word (2-3 sentences)

  ## Examples
  2-3 example sentences using the word naturally

  ## Usage Notes
  When and how this word is typically used, register, any common confusions (2-3 sentences)

  ## Related Words
  3-5 related words or synonyms, each with a brief note on how it differs

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

    return NextResponse.json({
      word: parsed.word || word,
      definition: parsed.definition || "",
      part_of_speech: parsed.part_of_speech || "",
      pronunciation: parsed.pronunciation || null,
      content: parsed.content || "",
    });
  } catch (err) {
    const errorMessage = err instanceof SyntaxError
      ? "Failed to parse AI response"
      : "AI lookup failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
