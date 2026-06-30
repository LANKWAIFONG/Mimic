const BASE = "https://financialmodelingprep.com/api/v3";

function apiKey() {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY is not set");
  return key;
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("apikey", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`FMP ${path} → ${res.status}`);
  return res.json();
}

export interface FmpIncomeStatement {
  date: string;
  fillingDate: string;
  acceptedDate: string;
  period: string;
  revenue: number;
  grossProfit: number;
  costOfRevenue: number;
  netIncome: number;
  eps: number;
}

export interface FmpBalanceSheet {
  date: string;
  fillingDate: string;
  acceptedDate: string;
  period: string;
  totalAssets: number;
  totalLiabilities: number;
  totalCurrentAssets: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  commonStock: number;
  weightedAverageShsOut: number;
}

export interface FmpCashFlow {
  date: string;
  fillingDate: string;
  acceptedDate: string;
  period: string;
  operatingCashFlow: number;
}

export interface FmpQuote {
  pe: number | null;
  priceToBook: number | null;
}

export async function getIncomeStatements(ticker: string, period: "annual" | "quarter" = "annual", limit = 5) {
  return get<FmpIncomeStatement[]>(`/income-statement/${ticker}`, { period, limit: String(limit) });
}

export async function getBalanceSheets(ticker: string, period: "annual" | "quarter" = "annual", limit = 5) {
  return get<FmpBalanceSheet[]>(`/balance-sheet-statement/${ticker}`, { period, limit: String(limit) });
}

export async function getCashFlows(ticker: string, period: "annual" | "quarter" = "annual", limit = 5) {
  return get<FmpCashFlow[]>(`/cash-flow-statement/${ticker}`, { period, limit: String(limit) });
}

export async function getQuote(ticker: string) {
  const data = await get<FmpQuote[]>(`/quote/${ticker}`);
  return data[0] ?? null;
}
