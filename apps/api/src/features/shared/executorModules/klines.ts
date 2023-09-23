import { KlineModel } from '#features/btStrategies/dataModels/kline.js';

export type KlineModule = {
  openTimestamp: Date;
  closeTimestamp: Date;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  quoteAssetVolume: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
  numTrades: number;
  raw: KlineModel;
  getAllOpen: () => readonly number[];
  getAllHigh: () => readonly number[];
  getAllLow: () => readonly number[];
  getAllClose: () => readonly number[];
  getAllVolume: () => readonly number[];
  getAllQuoteAssetVolume: () => readonly number[];
  getAllTakerBuyBaseAssetVolume: () => readonly number[];
  getAllTakerBuyQuoteAssetVolume: () => readonly number[];
  getAllNumTrades: () => readonly number[];
  getAllRaw: () => readonly KlineModel[];
};
