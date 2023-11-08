import { z } from "zod";
import { FilledOrder } from "./Order.js";
import { Price } from "./Kline.js";

export type Trade = OpeningTrade | ClosedTrade;

export type OpeningTrade = {
  /** Trade ID */
  id: TradeId;
  /** Entry order information */
  entryOrder: Extract<FilledOrder, { orderSide: "ENTRY" }>;
  /** Quantity of opening asset in current trade */
  tradeQuantity: TradeQuantity;
  /** Maximum price since the trade was opened */
  maxPrice: Price;
  /** Minimum price since the trade was opened */
  minPrice: Price;
  /** The maximum possible profit during the trade <br/>
   * Before fee deduction.
   */
  maxRunup: TradeRunup;
  /** The maximum possible loss during the trade <br/>
   * Before fee deduction.
   */
  maxDrawdown: TradeDrawdown;
  /** Current unrealized return (profit or loss) of this trade in capital currency <br/>
   * Before fee deduction. Losses are expressed as negative values.
   */
  unrealizedReturn: UnrealizedReturn;
};

export type ClosedTrade = Omit<OpeningTrade, "unrealizedReturn"> & {
  /** Exit order information */
  exitOrder: FilledOrder & { orderSide: "EXIT" };
  /** Realized net return (profit or loss) of this trade in capital currency <br/>
   * After entry and exit fees deduction. Losses are expressed as negative values.
   */
  netReturn: NetReturn;
};

export type TradeId = string & z.BRAND<"TradeId">;
export type TradeQuantity = number & z.BRAND<"TradeQuantity">;
export type TradeDrawdown = number & z.BRAND<"TradeDrawdown">;
export type TradeRunup = number & z.BRAND<"TradeRunup">;
export type UnrealizedReturn = number & z.BRAND<"UnrealizedReturn">;
export type NetReturn = number & z.BRAND<"NetReturn">;
