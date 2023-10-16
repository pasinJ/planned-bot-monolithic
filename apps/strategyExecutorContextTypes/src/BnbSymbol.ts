import { DeepReadonly } from "ts-essentials";
import { BaseSymbol } from "./Symbol.js";

export type BnbSymbol = BaseSymbol &
  DeepReadonly<{
    exchange: "BINANCE";
    bnbOrderTypes: BnbOrderType[];
    filters: (
      | LotSizeFilter
      | MarketLotSizeFilter
      | MinNotionalFilter
      | NotionalFilter
      | PriceFilter
    )[];
  }>;

export type BnbOrderType =
  | "MARKET"
  | "LIMIT"
  | "LIMIT_MAKER"
  | "STOP_LOSS"
  | "STOP_LOSS_LIMIT"
  | "TAKE_PROFIT"
  | "TAKE_PROFIT_LIMIT";

export type LotSizeFilter = Readonly<{
  type: "LOT_SIZE";
  minQty: number;
  maxQty: number;
  stepSize: number;
}>;
export type MarketLotSizeFilter = Readonly<{
  type: "MARKET_LOT_SIZE";
  minQty: number;
  maxQty: number;
  stepSize: number;
}>;
export type MinNotionalFilter = Readonly<{
  type: "MIN_NOTIONAL";
  minNotional: number;
  applyToMarket: boolean;
  avgPriceMins: number;
}>;
export type NotionalFilter = Readonly<{
  type: "NOTIONAL";
  minNotional: number;
  applyMinToMarket: boolean;
  maxNotional: number;
  applyMaxToMarket: boolean;
  avgPriceMins: number;
}>;
export type PriceFilter = Readonly<{
  type: "PRICE_FILTER";
  minPrice: number;
  maxPrice: number;
  tickSize: number;
}>;
