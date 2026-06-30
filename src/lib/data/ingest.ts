import type { SupabaseClient } from "@supabase/supabase-js";
import { getBalanceSheets, getCashFlows, getIncomeStatements, getQuote } from "./fmp";

/** Pilot set — 15 large S&P 500 companies across sectors. */
export const PILOT_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", // Tech
  "JPM", "BAC",                             // Financials
  "JNJ", "UNH",                             // Healthcare
  "XOM", "CVX",                             // Energy
  "PG", "KO",                               // Consumer staples
  "TSLA",                                   // Consumer discretionary
  "BRK-B",                                  // Conglomerate
];

const SECTOR_MAP: Record<string, string> = {
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology",
  AMZN: "Consumer Discretionary", META: "Technology",
  JPM: "Financials", BAC: "Financials",
  JNJ: "Healthcare", UNH: "Healthcare",
  XOM: "Energy", CVX: "Energy",
  PG: "Consumer Staples", KO: "Consumer Staples",
  TSLA: "Consumer Discretionary",
  "BRK-B": "Financials",
};

const COMPANY_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.", MSFT: "Microsoft Corp.", GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.", META: "Meta Platforms Inc.",
  JPM: "JPMorgan Chase & Co.", BAC: "Bank of America Corp.",
  JNJ: "Johnson & Johnson", UNH: "UnitedHealth Group Inc.",
  XOM: "Exxon Mobil Corp.", CVX: "Chevron Corp.",
  PG: "Procter & Gamble Co.", KO: "The Coca-Cola Co.",
  TSLA: "Tesla Inc.", "BRK-B": "Berkshire Hathaway Inc.",
};

export interface IngestResult {
  ticker: string;
  inserted: number;
  error?: string;
}

export async function ingestTicker(
  supabase: SupabaseClient,
  ticker: string,
  period: "annual" | "quarter" = "annual",
): Promise<IngestResult> {
  try {
    const [incomeList, balanceList, cashList, quote] = await Promise.all([
      getIncomeStatements(ticker, period, 5),
      getBalanceSheets(ticker, period, 5),
      getCashFlows(ticker, period, 5),
      getQuote(ticker),
    ]);

    // Ensure company row exists
    await supabase.from("companies").upsert(
      { ticker, name: COMPANY_NAMES[ticker] ?? ticker, sector: SECTOR_MAP[ticker] ?? null, is_sp500: true },
      { onConflict: "ticker" },
    );

    // Index balance + cash by period date for O(1) lookup
    const balanceByDate = Object.fromEntries(balanceList.map((r) => [r.date, r]));
    const cashByDate = Object.fromEntries(cashList.map((r) => [r.date, r]));

    let inserted = 0;
    for (const inc of incomeList) {
      const bal = balanceByDate[inc.date];
      const cf = cashByDate[inc.date];
      if (!bal || !cf) continue;

      // Use acceptedDate (SEC filing timestamp) as the point-in-time marker.
      // Fall back to fillingDate if acceptedDate is absent.
      const filedAt = inc.acceptedDate || inc.fillingDate || inc.date;

      const { error } = await supabase.from("fundamentals_snapshots").upsert(
        {
          ticker,
          period_end: inc.date,
          filed_at: filedAt,
          fiscal_period: `${inc.period}-${inc.date.slice(0, 4)}`,
          revenue: inc.revenue,
          net_income: inc.netIncome,
          cfo: cf.operatingCashFlow,
          total_assets: bal.totalAssets,
          total_liabilities: bal.totalLiabilities,
          current_assets: bal.totalCurrentAssets,
          current_liabilities: bal.totalCurrentLiabilities,
          gross_profit: inc.grossProfit,
          cost_of_revenue: inc.costOfRevenue,
          shares_outstanding: bal.weightedAverageShsOut ?? bal.commonStock,
          long_term_debt: bal.longTermDebt,
          // Only attach live quote valuation to the most-recent period
          pe_ratio: inc.date === incomeList[0]?.date ? (quote?.pe ?? null) : null,
          pb_ratio: inc.date === incomeList[0]?.date ? (quote?.priceToBook ?? null) : null,
          source: "fmp",
        },
        { onConflict: "ticker,period_end" },
      );

      if (!error) inserted++;
    }

    return { ticker, inserted };
  } catch (err) {
    return { ticker, inserted: 0, error: String(err) };
  }
}
