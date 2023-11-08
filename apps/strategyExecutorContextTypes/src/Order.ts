import { DeepReadonly } from "ts-essentials";
import { z } from "zod";
import { Price } from "./Kline.js";
import { ValidDate } from "./date.js";
import { AssetName } from "./Symbol.js";
import { Unbrand } from "./utils.js";

export type Order =
  | MarketOrder
  | LimitOrder
  | StopMarketOrder
  | StopLimitOrder
  | CancelOrder;

export type MarketOrder = DeepReadonly<
  BaseOrder & Market & (Pending | Filled | Rejected)
>;
export type LimitOrder = DeepReadonly<
  BaseOrder & Limit & (Pending | Opening | Filled | Canceled | Rejected)
>;
export type StopMarketOrder = DeepReadonly<
  BaseOrder & StopMarket & (Pending | Opening | Filled | Canceled | Rejected)
>;
export type StopLimitOrder = DeepReadonly<
  BaseOrder &
    StopLimit &
    (Pending | Opening | Triggered | Filled | Canceled | Rejected)
>;
export type CancelOrder = DeepReadonly<
  CancelBaseOrder & Cancel & (Pending | Submitted | Rejected)
>;

export type PendingOrderRequest = DeepReadonly<
  | (BaseOrder & Unbrand<Market | Limit | StopMarket | StopLimit> & Pending)
  | (CancelBaseOrder & Cancel & Pending)
>;
export type PendingOrder = DeepReadonly<
  | (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Pending)
  | (CancelBaseOrder & Cancel & Pending)
>;
export type SubmittedOrder = DeepReadonly<CancelBaseOrder & Cancel & Submitted>;
export type OpeningOrder = DeepReadonly<
  BaseOrder & (Limit | StopMarket | StopLimit) & Opening
>;
export type TriggeredOrder = DeepReadonly<
  BaseOrder & StopLimitOrder & Triggered
>;
export type FilledOrder = DeepReadonly<
  BaseOrder & (Market | Limit | StopMarket | StopLimit) & Filled
>;
export type CanceledOrder = DeepReadonly<
  BaseOrder & (Limit | StopMarket | StopLimit) & Canceled
>;
export type RejectedOrder = DeepReadonly<
  | (BaseOrder & Unbrand<Market | Limit | StopMarket | StopLimit> & Rejected)
  | (CancelBaseOrder & Cancel & Rejected)
>;

export type BaseOrder = { id: OrderId; createdAt: ValidDate } & (Entry | Exit);
export type CancelBaseOrder = { id: OrderId; createdAt: ValidDate };

export type OrderId = string & z.BRAND<"OrderId">;

export type OrderType =
  | "MARKET"
  | "LIMIT"
  | "STOP_MARKET"
  | "STOP_LIMIT"
  | "CANCEL";

export type OrderSide = "ENTRY" | "EXIT";

export type Entry = { orderSide: "ENTRY" };
export type Exit = { orderSide: "EXIT" };

export type Market = { type: "MARKET"; quantity: OrderQuantity };
export type Limit = {
  type: "LIMIT";
  quantity: OrderQuantity;
  limitPrice: OrderPrice;
};
export type StopMarket = {
  type: "STOP_MARKET";
  quantity: OrderQuantity;
  stopPrice: OrderPrice;
};
export type StopLimit = {
  type: "STOP_LIMIT";
  quantity: OrderQuantity;
  stopPrice: OrderPrice;
  limitPrice: OrderPrice;
};
export type Cancel = { type: "CANCEL"; orderIdToCancel: OrderId };

export type Pending = { status: "PENDING" };
export type Submitted = { status: "SUBMITTED"; submittedAt: ValidDate };
export type Opening = { status: "OPENING"; submittedAt: ValidDate };
export type Triggered = { status: "TRIGGERED"; submittedAt: ValidDate };
export type Filled = {
  status: "FILLED";
  filledPrice: Price;
  fee: Fee;
  submittedAt: ValidDate;
  filledAt: ValidDate;
};
export type Canceled = {
  status: "CANCELED";
  submittedAt: ValidDate;
  canceledAt: ValidDate;
};
export type Rejected = {
  status: "REJECTED";
  submittedAt: ValidDate;
  reason: string;
};

export type OrderQuantity = number & z.BRAND<"OrderQuantity">;
export type OrderPrice = number & z.BRAND<"OrderPrice">;
export type Fee = Readonly<{ amount: FeeAmount; currency: AssetName }>;
export type FeeAmount = number & z.BRAND<"FeeAmount">;
