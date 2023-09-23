import { z } from 'zod';

import { SymbolName } from '#features/symbols/dataModels/symbol.js';

export type OrderModule = {
  /**   Open a trade with a market order (Taker)
   * A market order is an instruction to buy immediately (at the market’s current price).
   * @param request can be either 'quantity' or 'quoteQuantity'
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'quoteQuantity' specifies the amount the user wants to spend the quote asset.
   * @returns void
   */
  enterMarket: (request: { quantity?: number } | { quoteQuantity?: number }) => void;
  /**   Open a trade with a limit order (Maker)
   * A limit order is an instruction to wait until the price hits a limit or better price before being executed.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'limitPrice' specifies limit price of order.
   * @returns void
   */
  enterLimit: (request: { quantity: number; limitPrice: number }) => void;
  /**   Open a trade with a stop market order (Taker)
   * Once the stop price is reached, it will automatically trigger a market order.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'stopPrice' specifies the price that will trigger the market order.
   * @returns void
   */
  enterStopMarket: (request: { quantity: number; stopPrice: number }) => void;
  /**   Open a trade with a stop limit order (Maker)
   * Once the stop price is reached, it will automatically trigger a limit order.
   * The order will then execute if the market price matches the limit price or better.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'stopPrice' specifies the price that will trigger the limit order.
   *    - 'limitPrice' specifies the price of limit order.
   * @returns void
   */
  enterStopLimit: (request: { quantity: number; stopPrice: number; limitPrice: number }) => void;
  /**   Exit a trade with a market order (Taker)
   * A market order is an instruction to sell immediately (at the market’s current price).
   * @param request can be either 'quantity' or 'quoteQuantity'
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'quoteQuantity' specifies the amount the user wants to receive the quote asset.
   * @returns void
   */
  exitMarket: (request: { quantity?: number } | { quoteQuantity?: number }) => void;
  /**   Exit a trade with a limit order (Maker)
   * A limit order is an instruction to wait until the price hits a limit or better price before being executed.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'limitPrice' specifies limit price of order.
   * @returns void
   */
  exitLimit: (request: { quantity: number; limitPrice: number }) => void;
  /**   Exit a trade with a stop market order (Taker)
   * Once the stop price is reached, it will automatically trigger a market order.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'stopPrice' specifies the price that will trigger the market order.
   * @returns void
   */
  exitStopMarket: (request: { quantity: number; stopPrice: number }) => void;
  /**   Exit a trade with a stop limit order (Maker)
   * Once the stop price is reached, it will automatically trigger a limit order.
   * The order will then execute if the market price matches the limit price or better.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'stopPrice' specifies the price that will trigger the limit order.
   *    - 'limitPrice' specifies the price of limit order.
   * @returns void
   */
  exitStopLimit: (request: { quantity: number; stopPrice: number; limitPrice: number }) => void;
  /**   Exit all trades with a market order (Taker)
   * A market order is an instruction to sell immediately (at the market’s current price).
   * @returns void
   */
  exitAll: () => void;
  /**   Cancel a pending order by referencing their ID
   * @returns void
   */
  cancel: (orderId: OrderId) => void;
  /**   Cancel all pending orders
   * @returns void
   */
  cancelAll: () => void;
  getPendingOrders: () => readonly PendingOrder[];
};

export type Order = PendingOrder | FilledOrder | CanceledOrder | RejectedOrder;

export type OrderId = string & z.BRAND<'OrderId'>;

type BaseOrder = {
  id: OrderId;
  symbol: SymbolName;
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';
  isEntry: boolean;
  price: number;
  currency: string;
  quantity: number;
  createdAt: Date;
};

export type PendingOrder = BaseOrder & { status: 'PENDING' };
export type FilledOrder = BaseOrder & { status: 'FILLED'; filledAt: Date };
export type CanceledOrder = BaseOrder & { status: 'CANCELED'; canceledAt: Date };
export type RejectedOrder = BaseOrder & { status: 'REJECTED'; reason: string };
