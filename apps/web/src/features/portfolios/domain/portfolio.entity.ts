import { z } from 'zod';

const accountIdSchema = z.string().min(1).max(36).brand('accountId');
// type AccountId = z.infer<typeof accountIdSchema>;

const portfolioIdSchema = z.string().min(1).max(36).brand('portfolioId');
// type PortfolioId = z.infer<typeof portfolioIdSchema>;

const tradingFeeRateSchema = z.number().min(0).max(100).brand('tradingFeeRate');
// type TradingFeeRate = z.infer<typeof tradingFeeRateSchema>;

export const portfolioSchema = z.object({
  accountId: accountIdSchema,
  portfolioId: portfolioIdSchema,
  takerFee: tradingFeeRateSchema,
  makerFee: tradingFeeRateSchema,
  version: z.number().min(0).int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Portfolio = z.infer<typeof portfolioSchema>;
