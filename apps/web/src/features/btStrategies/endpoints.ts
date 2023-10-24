import { z } from 'zod';

import { stringDatetimeToDate } from '#shared/common.type';
import { durationStringSchema } from '#shared/utils/string';

import {
  btExecutionId,
  btExecutionStatusEnum,
  btExecutionStatusSchema,
  executionLogsSchema,
  executionTimeSchema,
  progressPercentageSchema,
} from './btExecution';
import { btStrategyIdSchema, btStrategySchema } from './btStrategy';
import {
  canceledOrderSchema,
  filledOrderSchema,
  openingOrderSchema,
  rejectedOrderSchema,
  submittedOrderSchema,
  triggeredOrderSchema,
} from './order';
import {
  buyAndHoldReturnSchema,
  maxEquityDrawdownSchema,
  maxEquityRunupSchema,
  netLossSchema,
  netProfitSchema,
  profitFactorSchema,
  returnOfInvestmentSchema,
  totalFeesSchema,
  totalTradeVolumeSchema,
  winLossMetricsSchema,
} from './performance';
import { closedTradeSchema, netReturnSchema, openingTradeSchema } from './trade';

export const API_ENDPOINTS = {
  GET_BT_STRATEGIES: {
    method: 'GET',
    url: '/v1/backtesting-strategies',
    responseSchema: z.array(
      z
        .object({
          startTimestamp: stringDatetimeToDate,
          endTimestamp: stringDatetimeToDate,
          createdAt: stringDatetimeToDate,
          updatedAt: stringDatetimeToDate,
        })
        .passthrough()
        .pipe(btStrategySchema),
    ),
  },
  ADD_BT_STRATEGY: {
    method: 'POST',
    url: '/v1/backtesting-strategies',
    responseSchema: z.object({ id: btStrategyIdSchema, createdAt: stringDatetimeToDate }),
  },
  UPDATE_BT_STRATEGY: { method: 'PUT', url: '/v1/backtesting-strategies/:id', responseSchema: z.any() },
  EXECUTE_BT_STRATEGY: {
    method: 'POST',
    url: '/v1/backtesting-strategies/:id/execute',
    responseSchema: z.object({ id: btExecutionId, createdAt: stringDatetimeToDate }),
  },
  GET_EXECUTION_PROGRESS: {
    method: 'GET',
    url: '/v1/backtesting-strategies/:btStrategyId/execution/:btExecutionId/progress',
    responseSchema: z.object({
      status: btExecutionStatusSchema,
      percentage: progressPercentageSchema,
      logs: executionLogsSchema,
    }),
  },
  GET_EXECUTION_RESULT: {
    method: 'GET',
    url: '/v1/backtesting-strategies/:btStrategyId/execution/:btExecutionId/result',
    responseSchema: z.object({
      status: z.literal(btExecutionStatusEnum.FINISHED),
      executionTimeMs: executionTimeSchema,
      logs: executionLogsSchema,
      orders: z.object({
        openingOrders: openingOrderSchema.array(),
        submittedOrders: submittedOrderSchema.array(),
        triggeredOrders: triggeredOrderSchema.array(),
        filledOrders: filledOrderSchema.array(),
        canceledOrders: canceledOrderSchema.array(),
        rejectedOrders: rejectedOrderSchema.array(),
      }),
      trades: z.object({
        openingTrades: openingTradeSchema.array(),
        closedTrades: closedTradeSchema.array(),
      }),
      performance: z.object({
        netReturn: netReturnSchema,
        netProfit: netProfitSchema,
        netLoss: netLossSchema,
        buyAndHoldReturn: buyAndHoldReturnSchema,
        maxDrawdown: maxEquityDrawdownSchema,
        maxRunup: maxEquityRunupSchema,
        returnOfInvestment: returnOfInvestmentSchema,
        profitFactor: profitFactorSchema,
        totalTradeVolume: totalTradeVolumeSchema,
        totalFees: totalFeesSchema,
        backtestDuration: durationStringSchema,
        winLossMetrics: winLossMetricsSchema,
      }),
    }),
  },
} as const;
