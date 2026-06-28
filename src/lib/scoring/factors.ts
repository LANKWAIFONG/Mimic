import type { Factor, FactorContext, FactorSetId } from "./types";

function delta(curr: number | null, prior: number | null): number | null {
  if (curr === null || prior === null) return null;
  return curr - prior;
}

function positive(value: number | null): 0 | 1 | null {
  if (value === null) return null;
  return value > 0 ? 1 : 0;
}

/** Mimic One's custom 10-factor set. */
export const CUSTOM_FACTORS: Factor[] = [
  {
    key: "cfo_positive",
    label: "Operating Cash Flow positive",
    weight: 1,
    evaluate: ({ current }) => positive(current.cfo),
  },
  {
    key: "roa_change_positive",
    label: "Change in ROA positive",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) =>
      priorMetrics ? positive(delta(currentMetrics.roa, priorMetrics.roa)) : null,
  },
  {
    key: "current_ratio_change_positive",
    label: "Change in Current Ratio positive",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) =>
      priorMetrics
        ? positive(delta(currentMetrics.currentRatio, priorMetrics.currentRatio))
        : null,
  },
  {
    key: "gross_margin_change_positive",
    label: "Change in Gross Margin positive",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) =>
      priorMetrics
        ? positive(delta(currentMetrics.grossMargin, priorMetrics.grossMargin))
        : null,
  },
  {
    key: "asset_turnover_change_positive",
    label: "Change in Asset Turnover positive",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) =>
      priorMetrics
        ? positive(delta(currentMetrics.assetTurnover, priorMetrics.assetTurnover))
        : null,
  },
  {
    key: "no_new_shares",
    label: "No New Shares Issued",
    weight: 1,
    evaluate: ({ current, prior }) => {
      if (!prior || current.sharesOutstanding === null || prior.sharesOutstanding === null) {
        return null;
      }
      return current.sharesOutstanding <= prior.sharesOutstanding ? 1 : 0;
    },
  },
  {
    key: "net_income_positive",
    label: "Positive Net Income",
    weight: 1,
    evaluate: ({ current }) => positive(current.netIncome),
  },
  {
    key: "quality_of_earnings",
    label: "Quality of Earnings (CFO > Net Income)",
    weight: 1,
    evaluate: ({ current }) => {
      if (current.cfo === null || current.netIncome === null) return null;
      return current.cfo > current.netIncome ? 1 : 0;
    },
  },
  {
    key: "revenue_growth_positive",
    label: "Revenue Growth positive",
    weight: 1,
    evaluate: ({ current, prior }) =>
      prior ? positive(delta(current.revenue, prior.revenue)) : null,
  },
  {
    key: "valuation_sanity_check",
    label: "Valuation Sanity Check (P/E or P/B below sector median)",
    weight: 1,
    evaluate: ({ current }) => {
      const peBelow =
        current.peRatio !== null &&
        current.sectorPeMedian !== null &&
        current.peRatio < current.sectorPeMedian;
      const pbBelow =
        current.pbRatio !== null &&
        current.sectorPbMedian !== null &&
        current.pbRatio < current.sectorPbMedian;
      if (current.peRatio === null && current.pbRatio === null) return null;
      return peBelow || pbBelow ? 1 : 0;
    },
  },
];

/** Classic Piotroski 9-signal F-Score. */
export const PIOTROSKI_FACTORS: Factor[] = [
  {
    key: "roa_positive",
    label: "ROA positive",
    weight: 1,
    evaluate: ({ currentMetrics }) => positive(currentMetrics.roa),
  },
  {
    key: "cfo_positive",
    label: "CFO positive",
    weight: 1,
    evaluate: ({ current }) => positive(current.cfo),
  },
  {
    key: "roa_change_positive",
    label: "Change in ROA positive",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) =>
      priorMetrics ? positive(delta(currentMetrics.roa, priorMetrics.roa)) : null,
  },
  {
    key: "accruals",
    label: "Accruals (CFO > ROA)",
    weight: 1,
    evaluate: ({ current, currentMetrics }) => {
      if (current.cfo === null || current.totalAssets === null || currentMetrics.roa === null) {
        return null;
      }
      const cfoToAssets = current.totalAssets !== 0 ? current.cfo / current.totalAssets : null;
      if (cfoToAssets === null) return null;
      return cfoToAssets > currentMetrics.roa ? 1 : 0;
    },
  },
  {
    key: "leverage_change_decreased",
    label: "Change in Leverage decreased",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) => {
      if (!priorMetrics) return null;
      const change = delta(currentMetrics.leverage, priorMetrics.leverage);
      return change === null ? null : change < 0 ? 1 : 0;
    },
  },
  {
    key: "current_ratio_change_increased",
    label: "Change in Current Ratio increased",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) =>
      priorMetrics
        ? positive(delta(currentMetrics.currentRatio, priorMetrics.currentRatio))
        : null,
  },
  {
    key: "no_new_shares",
    label: "No New Shares Issued",
    weight: 1,
    evaluate: ({ current, prior }) => {
      if (!prior || current.sharesOutstanding === null || prior.sharesOutstanding === null) {
        return null;
      }
      return current.sharesOutstanding <= prior.sharesOutstanding ? 1 : 0;
    },
  },
  {
    key: "gross_margin_change_increased",
    label: "Change in Gross Margin increased",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) =>
      priorMetrics
        ? positive(delta(currentMetrics.grossMargin, priorMetrics.grossMargin))
        : null,
  },
  {
    key: "asset_turnover_change_increased",
    label: "Change in Asset Turnover increased",
    weight: 1,
    evaluate: ({ currentMetrics, priorMetrics }) =>
      priorMetrics
        ? positive(delta(currentMetrics.assetTurnover, priorMetrics.assetTurnover))
        : null,
  },
];

export const FACTOR_SETS: Record<FactorSetId, Factor[]> = {
  custom: CUSTOM_FACTORS,
  piotroski: PIOTROSKI_FACTORS,
};

export function evaluateFactors(factorSet: FactorSetId, ctx: FactorContext) {
  return FACTOR_SETS[factorSet].map((factor) => ({
    key: factor.key,
    label: factor.label,
    weight: factor.weight,
    passed: factor.evaluate(ctx),
  }));
}
