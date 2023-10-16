import { Price, Volume, NumTrades, Kline } from "./Kline.js";
import { ValidDate } from "./date.js";

export type KlinesModule = Readonly<{
  /** Open timestamp of the current kline */
  openTimestamp: ValidDate;
  /** Close timestamp of the current kline */
  closeTimestamp: ValidDate;
  /** Open price of the current kline */
  open: Price;
  /** Close price of the current kline */
  close: Price;
  /** High price of the current kline */
  high: Price;
  /** Low price of the current kline */
  low: Price;
  /** Volume of the current kline */
  volume: Volume;
  /** Quote asset volume of the current kline */
  quoteAssetVolume: Volume;
  /** Taker buy base asset volume of the current kline */
  takerBuyBaseAssetVolume: Volume;
  /** Taker buy quote asset volume of the current kline */
  takerBuyQuoteAssetVolume: Volume;
  /** Number of trades of the current kline */
  numTrades: NumTrades;
  /** Kline model of the current kline */
  raw: Kline;
  /** Get array of open price from oldest to earliest order */
  getAllOpen: () => readonly Price[];
  /** Get array of high price from oldest to earliest order */
  getAllHigh: () => readonly Price[];
  /** Get array of low price from oldest to earliest order */
  getAllLow: () => readonly Price[];
  /** Get array of close price from oldest to earliest order */
  getAllClose: () => readonly Price[];
  /** Get array of volume from oldest to earliest order */
  getAllVolume: () => readonly Volume[];
  /** Get array of quote asset volume from oldest to earliest order */
  getAllQuoteAssetVolume: () => readonly Volume[];
  /** Get array of taker buy base asset volume from oldest to earliest order */
  getAllTakerBuyBaseAssetVolume: () => readonly Volume[];
  /** Get array of taker buy quote asset volume from oldest to earliest order */
  getAllTakerBuyQuoteAssetVolume: () => readonly Volume[];
  /** Get array of number of trades from oldest to earliest order */
  getAllNumTrades: () => readonly NumTrades[];
  /** Get array of kline models from oldest to earliest order */
  getAllRaw: () => readonly Kline[];
}>;
