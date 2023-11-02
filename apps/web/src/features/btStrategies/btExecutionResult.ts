import { DeepReadonly, StrictExtract } from 'ts-essentials';

import { DurationString } from '#shared/utils/string';

import { BtExecutionStatus, ExecutionLogs, ExecutionTime } from './btExecution';
import {
  CanceledOrder,
  FilledOrder,
  OpeningOrder,
  RejectedOrder,
  SubmittedOrder,
  TriggeredOrder,
} from './order';
import {
  MaxEquityDrawdown,
  MaxEquityRunup,
  NetLoss,
  NetProfit,
  ProfitFactor,
  ReturnOfInvestment,
  TotalFees,
  TotalTradeVolume,
  WinLossMetrics,
} from './performance';
import { ClosedTrade, NetReturn, OpeningTrade } from './trade';

export type BtExecutionResult = BtExecutionSuccessResult | BtExecutionFailedResult;

export type BtExecutionSuccessResult = DeepReadonly<{
  status: StrictExtract<BtExecutionStatus, 'FINISHED'>;
  executionTimeMs: ExecutionTime;
  logs: ExecutionLogs;
  orders: {
    openingOrders: OpeningOrder[];
    submittedOrders: SubmittedOrder[];
    triggeredOrders: TriggeredOrder[];
    filledOrders: FilledOrder[];
    canceledOrders: CanceledOrder[];
    rejectedOrders: RejectedOrder[];
  };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
  performance: {
    netReturn: NetReturn;
    netProfit: NetProfit;
    netLoss: NetLoss;
    maxDrawdown: MaxEquityDrawdown;
    maxRunup: MaxEquityRunup;
    returnOfInvestment: ReturnOfInvestment;
    profitFactor: ProfitFactor;
    totalTradeVolume: TotalTradeVolume;
    totalFees: TotalFees;
    backtestDuration: DurationString;
    winLossMetrics: WinLossMetrics;
  };
}>;

export type BtExecutionFailedResult = DeepReadonly<{
  status: StrictExtract<BtExecutionStatus, 'TIMEOUT' | 'FAILED' | 'CANCELED' | 'INTERUPTED'>;
  executionTimeMs: ExecutionTime;
  logs: ExecutionLogs;
  error?: { name: string; type: string; message: string; causesList: string[] };
}>;
