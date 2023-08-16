import { generateMock } from '@anatine/zod-mock';
import { waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { BASE_URL } from '#infra/httpClient.constant';
import { renderHookWithContexts } from '#test-utils/render';

import { API_ENDPOINTS } from '../repositories/portfolioRepository.constant';
import usePortfolios from './usePortfolios';

const { url, responseSchema } = API_ENDPOINTS.GET_PORTFOLIOS;
const server = setupServer();
const serverUrl = `${BASE_URL}${url}`;

function renderUsePortfolios(enabled: boolean) {
  return renderHookWithContexts(() => usePortfolios(enabled), ['Infra', 'ServerState']);
}
function mockResponse() {
  return generateMock(responseSchema);
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('WHEN pass enabled = true to the hook', () => {
  it('THEN it should start loading data from server', () => {
    server.use(rest.get(serverUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(mockResponse()))));

    const { result } = renderUsePortfolios(true);

    expect(result.current.isInitialLoading).toEqual(true);
  });
});

describe('WHEN pass enabled = false to the hook', () => {
  it('THEN it should not load any data', () => {
    const { result } = renderUsePortfolios(false);

    expect(result.current.isInitialLoading).toEqual(false);
  });
});

describe('WHEN fetching data is successful', () => {
  it('THEN it should return data property equal to fetched data', async () => {
    const data = mockResponse();
    server.use(rest.get(serverUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(data))));

    const { result } = renderUsePortfolios(true);

    await waitFor(() => expect(result.current.data).toEqual(data));
  });
});

describe('WHEN fetching data fails', () => {
  it('THEN it should return error property', async () => {
    server.use(rest.get(serverUrl, (_, res, ctx) => res(ctx.status(400))));

    const { result } = renderUsePortfolios(true);

    await waitFor(() => expect(result.current.error).toHaveProperty('name', 'GET_PORTFOLIOS_ERROR'));
  });
});
