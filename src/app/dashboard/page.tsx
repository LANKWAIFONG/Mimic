import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { scoreUniverse } from "@/lib/scoring/engine";
import type { FactorSetId } from "@/lib/scoring/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ factorSet?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { factorSet: factorSetParam } = await searchParams;
  const factorSet: FactorSetId = factorSetParam === "piotroski" ? "piotroski" : "custom";

  const { data: companies } = await supabase
    .from("companies")
    .select("ticker")
    .eq("is_sp500", true);

  const tickers = (companies ?? []).map((c) => c.ticker as string);
  const today = new Date().toISOString().slice(0, 10);
  const rankings = tickers.length
    ? await scoreUniverse(supabase, tickers, today, factorSet)
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
        <form action={signOut}>
          <button className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-muted">Signed in as {user?.email}</p>

      <div className="mt-8 flex gap-2 text-sm">
        <a
          href="/dashboard?factorSet=custom"
          className={`rounded-full border px-4 py-1.5 transition-colors ${
            factorSet === "custom"
              ? "border-accent bg-accent-soft text-foreground"
              : "border-border text-muted hover:border-accent"
          }`}
        >
          Mimic One Factors
        </a>
        <a
          href="/dashboard?factorSet=piotroski"
          className={`rounded-full border px-4 py-1.5 transition-colors ${
            factorSet === "piotroski"
              ? "border-accent bg-accent-soft text-foreground"
              : "border-border text-muted hover:border-accent"
          }`}
        >
          Classic Piotroski F-Score
        </a>
      </div>

      {rankings.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No fundamentals data has been ingested yet — rankings will appear here
          once the S&amp;P 500 data pipeline is connected.
        </p>
      ) : (
        <ol className="mt-8 flex flex-col gap-2">
          {rankings.slice(0, 15).map((result, i) => (
            <li
              key={result.ticker}
              className="flex items-center justify-between rounded-lg border border-border bg-background-elevated px-4 py-3"
            >
              <span className="text-sm text-muted">
                {i + 1}. <span className="font-medium text-foreground">{result.ticker}</span>
              </span>
              <span className="text-sm font-medium text-foreground">
                {result.score} / {result.maxScore}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
