import * as te from 'fp-ts/lib/TaskEither';

import { HttpClient } from '#infra/httpClient.type';
import { CustomError } from '#utils/error';

import { Portfolio } from '../domain/portfolio.entity';

export type GetPortfolios = (deps: {
  httpClient: HttpClient;
}) => te.TaskEither<GetPortfoliosError, Portfolio[]>;
export class GetPortfoliosError extends CustomError<'GET_PORTFOLIOS_ERROR'>(
  'GET_PORTFOLIOS_ERROR',
  'Error happened when try to get portoflios',
) {}

export type CreatePortfolio = (
  body: {
    initialCapital: number;
    takerFee: number;
    makerFee: number;
  },
  deps: { httpClient: HttpClient },
) => te.TaskEither<CreatePortfolioError, Portfolio>;
export class CreatePortfolioError extends CustomError<'CREATE_PORTFOLIO_ERROR'>(
  'CREATE_PORTFOLIO_ERROR',
  'Error happened when try to create portoflio',
) {}
