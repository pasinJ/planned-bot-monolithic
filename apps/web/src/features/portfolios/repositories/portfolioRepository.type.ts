import * as te from 'fp-ts/lib/TaskEither';

import { HttpClient } from '#infra/httpClient.type';
import { ErrorBase } from '#utils/error';

import { Portfolio } from '../domain/portfolio.entity';

export type GetPortfolios = (deps: {
  httpClient: HttpClient;
}) => te.TaskEither<GetPortfoliosError, Portfolio[]>;
export class GetPortfoliosError extends ErrorBase<'GET_PORTFOLIOS_ERROR'> {}

export type CreatePortfolio = (
  body: {
    initialCapital: number;
    takerFee: number;
    makerFee: number;
  },
  deps: { httpClient: HttpClient },
) => te.TaskEither<CreatePortfolioError, Portfolio>;
export class CreatePortfolioError extends ErrorBase<'CREATE_PORTFOLIO_ERROR'> {}
