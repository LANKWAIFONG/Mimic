import type { DerivedMetrics, FundamentalsSnapshot } from "./types";

function safeDivide(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

export function deriveMetrics(snapshot: FundamentalsSnapshot): DerivedMetrics {
  return {
    roa: safeDivide(snapshot.netIncome, snapshot.totalAssets),
    currentRatio: safeDivide(snapshot.currentAssets, snapshot.currentLiabilities),
    grossMargin: safeDivide(snapshot.grossProfit, snapshot.revenue),
    assetTurnover: safeDivide(snapshot.revenue, snapshot.totalAssets),
    leverage: safeDivide(snapshot.totalLiabilities, snapshot.totalAssets),
  };
}
