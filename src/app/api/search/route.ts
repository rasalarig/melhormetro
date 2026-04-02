import { NextRequest, NextResponse } from "next/server";
import { openaiSearch, aiSearch, localSearch } from "@/lib/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [], query: "", mode: "empty" });
  }

  try {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasClaude = !!process.env.ANTHROPIC_API_KEY;

    let results;
    let mode: string;

    if (hasOpenAI) {
      results = await openaiSearch(query);
      mode = "openai";
    } else if (hasClaude) {
      results = await aiSearch(query);
      mode = "claude";
    } else {
      results = localSearch(query);
      mode = "local";
    }

    return NextResponse.json({
      results: results.map((r) => ({
        ...r.property,
        characteristics: JSON.parse(r.property.characteristics || "[]"),
        details: JSON.parse(r.property.details || "{}"),
        score: r.score,
        matchReasons: r.matchReasons,
      })),
      query,
      mode,
      total: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { results: [], query, mode: "error", error: "Search failed" },
      { status: 500 }
    );
  }
}
