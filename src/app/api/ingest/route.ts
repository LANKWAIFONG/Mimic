import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ingestTicker, PILOT_TICKERS } from "@/lib/data/ingest";

// Protect the endpoint with a secret so random visitors can't trigger ingestion.
function authorized(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  return token === process.env.INGEST_SECRET;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tickers: string[] = body.tickers ?? PILOT_TICKERS;
  const period: "annual" | "quarter" = body.period === "quarter" ? "quarter" : "annual";

  const supabase = createServiceClient();
  const results = [];

  for (const ticker of tickers) {
    const result = await ingestTicker(supabase, ticker, period);
    results.push(result);
    // Stay within FMP free-tier rate limit (10 req/s) — we fire 4 per ticker
    await new Promise((r) => setTimeout(r, 500));
  }

  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  const errors = results.filter((r) => r.error);

  return NextResponse.json({ totalInserted, results, errors });
}
