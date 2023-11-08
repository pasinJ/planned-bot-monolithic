import { DeepReadonly } from "ts-essentials";
import { z } from "zod";
import { ExchangeName } from "./Exchange.js";
import { Timeframe } from "./Kline.js";
import { FeeAmount } from "./Order.js";
import {
  StrategyName,
  TakerFeeRate,
  MakerFeeRate,
  InitialCapital,
  CapitalCurrency,
  AssetCurrency,
} from "./Strategy.js";
import { Symbol } from "./Symbol.js";

export type StrategyModule = DeepReadonly<{
  /** Name of strategy */
  name: StrategyName;
  /** Symbol information */
  symbol: Symbol;
  /** Timeframe */
  timeframe: Timeframe;
  /** Taker fee rate for MARKET and STOP_MARKET orders */
  takerFeeRate: TakerFeeRate;
  /** Maker fee rate for LIMIT and STOP_LIMIT orders */
  makerFeeRate: MakerFeeRate;
  
  /** Capital currency of strategy. This can be either base asset or quote asset of symbol */
  capitalCurrency: CapitalCurrency;
  /** Amount of initial capital in base currency */
  initialCapital: InitialCapital;
  /** Total current amount of capital in base currency */
  totalCapital: TotalCapital;
  /** Amount of capital in base currency that is in opening orders */
  inOrdersCapital: InOrdersCapital;
  /** Amount of available capital in base currency that isn't in opening orders or opening trades */
  availableCapital: AvailableCapital;

  /** Asset currency of strategy. This can be either base asset or quote asset of symbol */
  assetCurrency: AssetCurrency;
  /** Total amount of holding asset in asset currency */
  totalAssetQuantity: TotalAssetQuantity;
  /** Amount of holding asset in asset currency that is in opening orders */
  inOrdersAssetQuantity: InOrdersAssetQuantity;
  /** Amount of holding asset in asset currency that isn't in opening orders */
  availableAssetQuantity: AvailableAssetQuantity;

  /** Total current unrealized return (profit and loss) of all opening trades in base currency <br/>
   * (Losses are expressed as negative values.)
   */
  openReturn: Return;
  /** Total current return (profit and loss) of all closed trades in base currency <br/>
   * (Losses are expressed as negative values.)
   */
  netReturn: Return;
  /** Total current profit of all winning trades in base currency */
  netProfit: Profit;
  /** Total current loss of all losing trades in base currency */
  netLoss: Loss;

  /** Current equity in base currency (initialCapital + netReturn + openReturn) */
  equity: Equity;
  /** Maximum equity drawdown value in base currency up until now */
  maxDrawdown: EquityDrawdown;
  /** Maximum equity run-up value in base currency up until now */
  maxRunup: EquityRunup;

  /** Sum of entry and exit fees */
  totalFees: { inCapitalCurrency: FeeAmount; inAssetCurrency: FeeAmount }; //
}>;

export type TotalCapital = number & z.BRAND<"TotalCapital">;
export type InOrdersCapital = number & z.BRAND<"InOrdersCapital">;
export type AvailableCapital = number & z.BRAND<"AvailableCapital">;
export type TotalAssetQuantity = number & z.BRAND<"TotalAssetQuantity">;
export type InOrdersAssetQuantity = number & z.BRAND<"InOrdersAssetQuantity">;
export type AvailableAssetQuantity = number & z.BRAND<"AvailableAssetQuantity">;
export type Return = number & z.BRAND<"Return">;
export type Profit = number & z.BRAND<"Profit">;
export type Loss = number & z.BRAND<"Loss">;
export type Equity = number & z.BRAND<"Equity">;
export type EquityDrawdown = number & z.BRAND<"EquityDrawdown">;
export type EquityRunup = number & z.BRAND<"EquityRunup">;
