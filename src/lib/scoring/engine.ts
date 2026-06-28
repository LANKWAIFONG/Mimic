import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateFactors, FACTOR_SETS } from "./factors";
import { getPointInTimeSnapshots } from "./fundamentals";
import { deriveMetrics } from "./metrics";
import type { FactorSetId, ScoreResult } from "./types";

/**
 * Scores one company as of a given date using only data that was filed on
 * or before that date. Used identically by the live rankings dashboard
 * (asOfDate = today) and the backtester (asOfDate = any historical date) so
 * there is exactly one code path and no way for the dashboard to drift out
 * of sync with backtest behavior.
 */
export async function scoreCompany(
  supabase: SupabaseClient,
  ticker: string,
  asOfDate: string,
  factorSet: FactorSetId,
): Promise<ScoreResult | null> {
  const snapshots = await getPointInTimeSnapshots(supabase, ticker, asOfDate);
  if (!snapshots) return null;

  const { current, prior } = snapshots;
  const currentMetrics = deriveMetrics(current);
  const priorMetrics = prior ? deriveMetrics(prior) : null;

  const breakdown = evaluateFactors(factorSet, {
    current,
    prior,
    currentMetrics,
    priorMetrics,
  });

  const score = breakdown.reduce((sum, f) => sum + (f.passed === 1 ? f.weight : 0), 0);
  const maxScore = FACTOR_SETS[factorSet].reduce((sum, f) => sum + f.weight, 0);

  return {
    ticker,
    asOfDate,
    factorSet,
    score,
    maxScore,
    breakdown,
    snapshotId: current.id,
    priorSnapshotId: prior?.id ?? null,
  };
}

export async function scoreUniverse(
  supabase: SupabaseClient,
  tickers: string[],
  asOfDate: string,
  factorSet: FactorSetId,
): Promise<ScoreResult[]> {
  const results = await Promise.all(
    tickers.map((ticker) => scoreCompany(supabase, ticker, asOfDate, factorSet)),
  );
  return results
    .filter((r): r is ScoreResult => r !== null)
    .sort((a, b) => b.score - a.score);
}

/** Persists a score result to factor_scores so rankings/backtests don't recompute repeatedly. */
export async function cacheScoreResult(supabase: SupabaseClient, result: ScoreResult) {
  const { error } = await supabase.from("factor_scores").upsert(
    {
      ticker: result.ticker,
      as_of_date: result.asOfDate,
      factor_set: result.factorSet,
      score: result.score,
      max_score: result.maxScore,
      breakdown: result.breakdown,
      snapshot_id: result.snapshotId,
      prior_snapshot_id: result.priorSnapshotId,
    },
    { onConflict: "ticker,as_of_date,factor_set" },
  );
  if (error) throw error;
}
