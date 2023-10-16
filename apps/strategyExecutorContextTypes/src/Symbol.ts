import { DeepReadonly } from "ts-essentials";
import { z } from "zod";
import { ExchangeName } from "./Exchange.js";
import { OrderType } from "./Order.js";
import { BnbSymbol } from "./BnbSymbol.js";

export type Symbol = BnbSymbol;

export type BaseSymbol = DeepReadonly<{
  name: SymbolName;
  exchange: ExchangeName;
  baseAsset: AssetName;
  baseAssetPrecision: BaseAssetPrecisionNumber;
  quoteAsset: AssetName;
  quoteAssetPrecision: QuoteAssetPrecisionNumber;
  orderTypes: OrderType[];
}>;

export type SymbolName = string & z.BRAND<"SymbolName">;
export type AssetName = string & z.BRAND<"AssetName">;

export type AssetPrecisionNumber = number & z.BRAND<"AssetPrecisionNumber">;
export type BaseAssetPrecisionNumber = AssetPrecisionNumber &
  z.BRAND<"BaseAssetPrecisionNumber">;
export type QuoteAssetPrecisionNumber = AssetPrecisionNumber &
  z.BRAND<"QuoteAssetPrecisionNumber">;
