import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { API_ENDPOINTS } from './portfolioRepository.constant';
import {
  CreatePortfolio,
  CreatePortfolioError,
  GetPortfolios,
  GetPortfoliosError,
} from './portfolioRepository.type';

export function getPortfolios(...[{ httpClient }]: Parameters<GetPortfolios>): ReturnType<GetPortfolios> {
  const { method, url, responseSchema } = API_ENDPOINTS.GET_PORTFOLIOS;
  return pipe(
    httpClient.sendRequest({ method, url, responseSchema }),
    te.mapLeft((error) => new GetPortfoliosError().causedBy(error)),
  );
}

export function createPortfolio(
  ...[body, { httpClient }]: Parameters<CreatePortfolio>
): ReturnType<CreatePortfolio> {
  const { method, url, responseSchema } = API_ENDPOINTS.CREATE_PORTFOLIO;
  return pipe(
    httpClient.sendRequest({ method, url, body, responseSchema }),
    te.mapLeft((error) => new CreatePortfolioError().causedBy(error)),
  );
}
