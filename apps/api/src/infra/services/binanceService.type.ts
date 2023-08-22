import { ErrorBase, ExternalError } from '#shared/error.js';

// export type BinanceService = {};

export class CreateBinanceServiceError extends ErrorBase<'CREATE_BINANCE_SERVICE_ERROR', ExternalError> {}
