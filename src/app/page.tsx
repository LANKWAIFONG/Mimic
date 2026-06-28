import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col flex-1 items-center">
      <header className="w-full border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-lg font-semibold tracking-tight">
              Mimic One
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm text-muted">
            <Link href="/dashboard">Rankings</Link>
            <span>Portfolio</span>
            <span>Backtest</span>
            {user ? (
              <form action={signOut}>
                <button className="rounded-full border border-border bg-background-elevated px-4 py-1.5 text-foreground transition-colors hover:border-accent">
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-border bg-background-elevated px-4 py-1.5 text-foreground transition-colors hover:border-accent"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <span className="rounded-full border border-border bg-background-elevated px-4 py-1 text-xs tracking-wide text-muted">
          Fundamental factor scoring · point-in-time backtesting
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Rank the S&amp;P 500 on the factors that actually predict
          fundamental improvement.
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted">
          Mimic One scores every constituent on Piotroski-style fundamental
          signals, ranks the top picks, and backtests a quarterly-rebalanced
          portfolio without lookahead bias.
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent-2"
          >
            View top rankings
          </Link>
          <button className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-foreground">
            Run a backtest
          </button>
        </div>
      </main>

      <footer className="w-full border-t border-border py-6 text-center text-xs text-muted">
        Mimic One — research tool, not investment advice.
      </footer>
    </div>
  );
}
