import type { SupabaseClient } from "@supabase/supabase-js";
import type { FundamentalsSnapshot } from "./types";

interface FundamentalsRow {
  id: number;
  ticker: string;
  period_end: string;
  filed_at: string;
  fiscal_period: string;
  revenue: number | null;
  net_income: number | null;
  cfo: number | null;
  total_assets: number | null;
  total_liabilities: number | null;
  current_assets: number | null;
  current_liabilities: number | null;
  gross_profit: number | null;
  cost_of_revenue: number | null;
  shares_outstanding: number | null;
  long_term_debt: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  sector_pe_median: number | null;
  sector_pb_median: number | null;
}

function toSnapshot(row: FundamentalsRow): FundamentalsSnapshot {
  return {
    id: row.id,
    ticker: row.ticker,
    periodEnd: row.period_end,
    filedAt: row.filed_at,
    fiscalPeriod: row.fiscal_period,
    revenue: row.revenue,
    netIncome: row.net_income,
    cfo: row.cfo,
    totalAssets: row.total_assets,
    totalLiabilities: row.total_liabilities,
    currentAssets: row.current_assets,
    currentLiabilities: row.current_liabilities,
    grossProfit: row.gross_profit,
    costOfRevenue: row.cost_of_revenue,
    sharesOutstanding: row.shares_outstanding,
    longTermDebt: row.long_term_debt,
    peRatio: row.pe_ratio,
    pbRatio: row.pb_ratio,
    sectorPeMedian: row.sector_pe_median,
    sectorPbMedian: row.sector_pb_median,
  };
}

/**
 * Returns the two most recent fundamentals snapshots that were *publicly
 * filed* on or before `asOfDate` — never the most recent by period_end.
 * This is what keeps backtests free of lookahead bias: a snapshot whose
 * period ended before asOfDate but which wasn't filed until after it is
 * correctly excluded.
 */
export async function getPointInTimeSnapshots(
  supabase: SupabaseClient,
  ticker: string,
  asOfDate: string,
): Promise<{ current: FundamentalsSnapshot; prior: FundamentalsSnapshot | null } | null> {
  const { data, error } = await supabase
    .from("fundamentals_snapshots")
    .select("*")
    .eq("ticker", ticker)
    .lte("filed_at", asOfDate)
    .order("period_end", { ascending: false })
    .limit(2);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const [current, prior] = data as FundamentalsRow[];
  return {
    current: toSnapshot(current),
    prior: prior ? toSnapshot(prior) : null,
  };
}
