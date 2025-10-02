export type ConditionStatus = 'O' | 'X';

export interface Condition {
  id: number;
  description: string;
  details: string;
  status: ConditionStatus;
}

export type Position = 'long' | 'short';

export interface CalculationResult {
  leverage: number;
  quantity: number;
  maxQuantity: number;
  riskRewardTargetPrice: number;
  totalLoss: number;
  lossRate: number;
  liquidationPrice: number;
  profitTotal: number;
  profitRate: number;
  totalFee: number;
  stopLossPrice?: number;
}

export interface SplitPurchaseResultRow {
  round: number;
  entryPrice: number;
  entryAmount: number;
  quantity: number;
  cumulativeEntryAmount: number;
  cumulativeQuantity: number;
  averagePrice: number;
}

export interface SplitPurchaseSummary {
    finalAveragePrice: number;
    totalEntryAmount: number;
    totalHeldQuantity: number;
}