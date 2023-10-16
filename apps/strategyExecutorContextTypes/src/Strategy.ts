import { z } from "zod";
import { AssetName } from "./Symbol.js";

export type StrategyName = string & z.BRAND<"StrategyName">;
export type InitialCapital = number & z.BRAND<"InitialCapital">;
export type FeeRate = number & z.BRAND<"FeeRate">;
export type TakerFeeRate = FeeRate & z.BRAND<"TakerFeeRate">;
export type MakerFeeRate = FeeRate & z.BRAND<"MakerFeeRate">;

export type CapitalCurrency = AssetName & z.BRAND<"CapitalCurrency">;
export type AssetCurrency = AssetName & z.BRAND<"AssetCurrency">;
