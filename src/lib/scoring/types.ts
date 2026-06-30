export type FactorSetId = "custom" | "piotroski";

/** A single reported fiscal period, as it would have been known as of `filedAt`. */
export interface FundamentalsSnapshot {
  id: number;
  ticker: string;
  periodEnd: string;
  filedAt: string;
  fiscalPeriod: string;
  revenue: number | null;
  netIncome: number | null;
  cfo: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  grossProfit: number | null;
  costOfRevenue: number | null;
  sharesOutstanding: number | null;
  longTermDebt: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  sectorPeMedian: number | null;
  sectorPbMedian: number | null;
}

/** Ratios derived from a snapshot, computed once and reused across factors. */
export interface DerivedMetrics {
  roa: number | null;
  currentRatio: number | null;
  grossMargin: number | null;
  assetTurnover: number | null;
  leverage: number | null;
}

export interface FactorContext {
  current: FundamentalsSnapshot;
  prior: FundamentalsSnapshot | null;
  currentMetrics: DerivedMetrics;
  priorMetrics: DerivedMetrics | null;
}

export interface Factor {
  key: string;
  label: string;
  weight: number;
  /** Returns 1 if the signal is positive/passing, 0 otherwise. Null if undecidable from available data. */
  evaluate: (ctx: FactorContext) => 0 | 1 | null;
}

export interface FactorResult {
  key: string;
  label: string;
  weight: number;
  passed: 0 | 1 | null;
}

export interface ScoreResult {
  ticker: string;
  asOfDate: string;
  factorSet: FactorSetId;
  score: number;
  maxScore: number;
  breakdown: FactorResult[];
  snapshotId: number;
  priorSnapshotId: number | null;
}
