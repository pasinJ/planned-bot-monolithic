import { generateMock } from '@anatine/zod-mock';
import { faker } from '@faker-js/faker';
import { act, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { API_BASE_URL } from '#infra/httpClient.constant';
import { renderHookWithContexts } from '#test-utils/render';

import { API_ENDPOINTS } from '../repositories/portfolioRepository.constant';
import useCreatePortfolio from './useCreatePortfolio';

const { url, responseSchema } = API_ENDPOINTS.CREATE_PORTFOLIO;
const server = setupServer();
const serverUrl = `${API_BASE_URL}${url}`;

function renderUseCreatePortfolio(init?: { onSuccess?: () => void }) {
  return renderHookWithContexts(
    () => useCreatePortfolio({ onSuccess: init?.onSuccess }),
    ['Infra', 'ServerState'],
  );
}
function mockData() {
  return {
    initialCapital: faker.string.numeric(3),
    takerFee: faker.number.float(3).toString(),
    makerFee: faker.number.float(3).toString(),
  };
}
function mockResponse() {
  return generateMock(responseSchema);
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('WHEN creating data is successful', () => {
  it('THEN it should call passed onSuccess function', async () => {
    const data = mockResponse();
    server.use(rest.post(serverUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(data))));

    const onSuccessSpy = jest.fn();
    const { result } = renderUseCreatePortfolio({ onSuccess: onSuccessSpy });
    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(onSuccessSpy).toHaveBeenCalledOnce());
  });
  it('THEN it should return data property equal to fetched data', async () => {
    const data = mockResponse();
    server.use(rest.post(serverUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(data))));

    const { result } = renderUseCreatePortfolio();
    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(result.current.data).toEqual(data));
  });
});

describe('WHEN try to create a portfolio with invalid data', () => {
  it('THEN it should return error property', async () => {
    server.use(rest.post(serverUrl, (_, res, ctx) => res(ctx.status(400))));

    const { result } = renderUseCreatePortfolio();
    const data = { initialCapital: 'abc', takerFee: '1.0', makerFee: '1.0' };
    act(() => result.current.mutate(data));

    await waitFor(() => expect(result.current.error).toHaveProperty('name', 'MISMATCH_SCHEMA'));
  });
});

describe('WHEN creating data fails', () => {
  it('THEN it should return error property', async () => {
    server.use(rest.post(serverUrl, (_, res, ctx) => res(ctx.status(400))));

    const { result } = renderUseCreatePortfolio();
    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(result.current.error).toHaveProperty('name', 'CREATE_PORTFOLIO_ERROR'));
  });
});
