import { DeepReadonly } from "ts-essentials";
import {
  OrderId,
  PendingOrderRequest,
  SubmittedOrder,
  OpeningOrder,
  TriggeredOrder,
  FilledOrder,
  CanceledOrder,
  RejectedOrder,
} from "./Order.js";

export type OrdersModule = DeepReadonly<{
  /**   Enter a trading position with a market order (Taker)
   * A market order is an instruction to buy immediately (at the market’s current price).
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   * @returns void
   */
  enterMarket: (request: {
    quantity: number;
  }) => Extract<PendingOrderRequest, { type: "MARKET"; orderSide: "ENTRY" }>;
  /**   Enter a trading position with a limit order (Maker)
   * A limit order is an instruction to wait until the price hits a limit or better price before being executed.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'limitPrice' specifies limit price of order.
   * @returns void
   */
  enterLimit: (request: {
    quantity: number;
    limitPrice: number;
  }) => Extract<PendingOrderRequest, { type: "LIMIT"; orderSide: "ENTRY" }>;
  /**   Enter a trading position with a stop market order (Taker)
   * Once the stop price is reached, it will automatically trigger a market order.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'stopPrice' specifies the price that will trigger the market order.
   * @returns void
   */
  enterStopMarket: (request: {
    quantity: number;
    stopPrice: number;
  }) => Extract<
    PendingOrderRequest,
    { type: "STOP_MARKET"; orderSide: "ENTRY" }
  >;
  /**   Enter a trading position with a stop limit order (Maker)
   * Once the stop price is reached, it will automatically trigger a limit order.
   * The order will then execute if the market price matches the limit price or better.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'stopPrice' specifies the price that will trigger the limit order.
   *    - 'limitPrice' specifies the price of limit order.
   * @returns void
   */
  enterStopLimit: (request: {
    quantity: number;
    stopPrice: number;
    limitPrice: number;
  }) => Extract<
    PendingOrderRequest,
    { type: "STOP_LIMIT"; orderSide: "ENTRY" }
  >;
  /**   Exit a trading position with a market order (Taker)
   * A market order is an instruction to sell immediately (at the market’s current price).
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   * @returns void
   */
  exitMarket: (request: {
    quantity: number;
  }) => Extract<PendingOrderRequest, { type: "MARKET"; orderSide: "EXIT" }>;
  /**   Exit a trading position with a limit order (Maker)
   * A limit order is an instruction to wait until the price hits a limit or better price before being executed.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'limitPrice' specifies limit price of order.
   * @returns void
   */
  exitLimit: (request: {
    quantity: number;
    limitPrice: number;
  }) => Extract<PendingOrderRequest, { type: "LIMIT"; orderSide: "EXIT" }>;
  /**   Exit a trading position with a stop market order (Taker)
   * Once the stop price is reached, it will automatically trigger a market order.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'stopPrice' specifies the price that will trigger the market order.
   * @returns void
   */
  exitStopMarket: (request: {
    quantity: number;
    stopPrice: number;
  }) => Extract<
    PendingOrderRequest,
    { type: "STOP_MARKET"; orderSide: "EXIT" }
  >;
  /**   Exit a trading position with a stop limit order (Maker)
   * Once the stop price is reached, it will automatically trigger a limit order.
   * The order will then execute if the market price matches the limit price or better.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'stopPrice' specifies the price that will trigger the limit order.
   *    - 'limitPrice' specifies the price of limit order.
   * @returns void
   */
  exitStopLimit: (request: {
    quantity: number;
    stopPrice: number;
    limitPrice: number;
  }) => Extract<PendingOrderRequest, { type: "STOP_LIMIT"; orderSide: "EXIT" }>;
  /**   Cancel a pending or opening order by referencing their ID
   * @returns void
   */
  cancelOrder: (orderId: OrderId) => void;
  /**   Cancel pending and opening orders
   * @returns void
   */
  cancelAllOrders: (request?: {
    type?: readonly ("ENTRY" | "EXIT" | "CANCEL")[];
    status?: "PENDING" | "OPENING" | "TRIGGERED" | "ALL";
  }) => void;
  getPendingOrders: () => readonly PendingOrderRequest[];
  getSubmittedOrders: () => readonly SubmittedOrder[];
  getOpeningOrders: () => readonly OpeningOrder[];
  getTriggeredOrders: () => readonly TriggeredOrder[];
  getFilledOrders: () => readonly FilledOrder[];
  getCanceledOrders: () => readonly CanceledOrder[];
  getRejectedOrders: () => readonly RejectedOrder[];
}>;
