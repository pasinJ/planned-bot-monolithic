import { generateMock } from '@anatine/zod-mock';
import { rest, setupWorker } from 'msw';

import { API_ENDPOINTS } from '#features/portfolios/repositories/portfolioRepository.constant';
import { BASE_URL } from '#infra/httpClient.constant';

const { GET_PORTFOLIOS, CREATE_PORTFOLIO } = API_ENDPOINTS;

const getPortfoliosUrl = BASE_URL + GET_PORTFOLIOS.url;
const mockGetPortfoliosResp = generateMock(GET_PORTFOLIOS.responseSchema);

const createPortfoliosUrl = BASE_URL + CREATE_PORTFOLIO.url;
const mockCreatePortfolioResp = generateMock(CREATE_PORTFOLIO.responseSchema);

let portfolioCreated = false;

export const worker = setupWorker(
  rest.get(getPortfoliosUrl, (_, res, ctx) =>
    res(ctx.status(200), ctx.json(portfolioCreated ? mockGetPortfoliosResp : [])),
  ),
  rest.post(createPortfoliosUrl, (_, res, ctx) => {
    portfolioCreated = true;
    return res(ctx.status(400), ctx.json(mockCreatePortfolioResp));
  }),
);
