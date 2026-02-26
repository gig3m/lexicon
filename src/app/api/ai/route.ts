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
- "definition": a clear, concise definition (1-2 sentences, bolded in the style of a dictionary entry)
- "part_of_speech": the primary part of speech (e.g. "noun", "verb", "adjective")
- "pronunciation": the pronunciation key (e.g. "ih-FEM-er-ul")
- "content": a markdown string with two sections:

  First, a flowing explanation with NO header. Weave together the word's etymology (including original language roots in italics), how and when it is used, what distinguishes it from related terms, and natural example usage — all in connected prose paragraphs. Write in a clear, authoritative but accessible style. Aim for 2-4 paragraphs. Think of this as the explanatory essay a well-read friend would write, not a rigid dictionary entry.

  Then, a "## Related Terms" section with a bullet list of 3-6 related words or concepts.

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
    const encoded = encodeURIComponent(parsed.word || word);
    const sources = [
      `- [Merriam-Webster](https://www.merriam-webster.com/dictionary/${encoded})`,
      `- [Etymology Online](https://www.etymonline.com/word/${encoded})`,
      `- [Wikipedia](https://en.wikipedia.org/wiki/${encoded})`,
      `- [Wiktionary](https://en.wiktionary.org/wiki/${encoded})`,
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
