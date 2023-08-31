import { faker } from '@faker-js/faker';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { zipObj } from 'ramda';
import { z } from 'zod';

import { executeT } from '#utils/fp';

import { createAxiosHttpClient } from './axiosHttpClient';
import { API_BASE_URL, HTTP_ERRORS } from './httpClient.constant';
import { HttpClient, Method } from './httpClient.type';

function randomUrl(prefix = '/echo') {
  return prefix + '/' + faker.word.noun();
}
function randomObject() {
  return zipObj(
    faker.helpers.multiple(() => faker.word.noun(), { count: 3 }),
    faker.helpers.multiple(() => faker.word.noun(), { count: 3 }),
  );
}
function createSendRequestOptions(overrides?: Partial<Parameters<HttpClient['sendRequest']>[0]>) {
  return {
    method: faker.internet.httpMethod(),
    url: randomUrl(),
    headers: randomObject(),
    params: randomObject(),
    body: randomObject(),
    responseSchema: z.any(),
    ...overrides,
  } as const;
}

const server = setupServer(
  rest.all(`${API_BASE_URL}/200`, (_, res, ctx) => res(ctx.status(200), ctx.json({ success: true }))),
  rest.all(`${API_BASE_URL}/400`, (_, res, ctx) => res(ctx.status(400))),
  rest.all(`${API_BASE_URL}/401`, (_, res, ctx) => res(ctx.status(401))),
  rest.all(`${API_BASE_URL}/403`, (_, res, ctx) => res(ctx.status(403))),
  rest.all(`${API_BASE_URL}/404`, (_, res, ctx) => res(ctx.status(404))),
  rest.all(`${API_BASE_URL}/409`, (_, res, ctx) => res(ctx.status(409))),
  rest.all(`${API_BASE_URL}/4xx`, (_, res, ctx) => res(ctx.status(410))),
  rest.all(`${API_BASE_URL}/500`, (_, res, ctx) => res(ctx.status(500))),
  rest.all(`${API_BASE_URL}/5xx`, (_, res, ctx) => res(ctx.status(501))),
  rest.all(/\/echo\//, async (req, res, ctx) => {
    const body = await req.text();
    return res(
      ctx.json({
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers),
        params: Object.fromEntries(req.url.searchParams),
        body: body !== '' ? (JSON.parse(body) as unknown) : undefined,
      }),
    );
  }),
);

beforeAll(() =>
  server.listen({
    onUnhandledRequest: ({ method, url }) => {
      if (!url.pathname.startsWith('/noResponse'))
        console.warn('Found an unhandled %s request to %s', method, url.href);
    },
  }),
);
afterAll(() => server.close());

describe('Axios HTTP client send request', () => {
  it('WHEN request with specific url THEN HTTP client should also send out request to that url', async () => {
    const httpClient = createAxiosHttpClient();
    const url = randomUrl();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ url })));
    expect(resp).toBeRight();
    expect(resp).toHaveProperty('right.url', expect.stringContaining(url));
  });

  it.each<{ method: Method }>([
    { method: 'GET' },
    { method: 'POST' },
    { method: 'PUT' },
    { method: 'PATCH' },
    { method: 'DELETE' },
    { method: 'HEAD' },
    { method: 'OPTIONS' },
    { method: 'PURGE' },
    { method: 'LINK' },
    { method: 'UNLINK' },
  ])(
    'WHEN request with options method = $method THEN HTTP client should also send out $method method',
    async ({ method }) => {
      const httpClient = createAxiosHttpClient();

      const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ method })));
      expect(resp).toEqualRight(expect.objectContaining({ method }));
    },
  );

  it('WHEN request with headers THEN HTTP client should also send out request with that headers', async () => {
    const httpClient = createAxiosHttpClient();
    const headers = randomObject();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ headers })));
    expect(resp).toBeRight();
    expect(resp).toHaveProperty('right.headers', expect.objectContaining(headers));
  });

  it('WHEN request with params THEN HTTP client should also send out request with that params', async () => {
    const httpClient = createAxiosHttpClient();
    const params = randomObject();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ params })));
    expect(resp).toBeRight();
    expect(resp).toHaveProperty('right.params', params);
  });

  it('WHEN request with body THEN HTTP client should also send out request with that body', async () => {
    const httpClient = createAxiosHttpClient();
    const body = randomObject();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ body })));
    expect(resp).toBeRight();
    expect(resp).toHaveProperty('right.body', body);
  });

  it('WHEN response body match the given schema THEN it should return Right of response body', async () => {
    const httpClient = createAxiosHttpClient();

    const resp = await executeT(
      httpClient.sendRequest(
        createSendRequestOptions({ url: '/200', responseSchema: z.object({ success: z.boolean() }) }),
      ),
    );
    expect(resp).toEqualRight({ success: true });
  });

  it('WHEN response body does not match the given schema THEN it should return Left of Error', async () => {
    const httpClient = createAxiosHttpClient();

    const resp = await executeT(
      httpClient.sendRequest(
        createSendRequestOptions({ url: '/200', responseSchema: z.object({ success: z.string() }) }),
      ),
    );
    expect(resp).toEqualLeft(expect.objectContaining({ name: 'INVALID_RESPONSE' }));
  });

  it.each([
    { statusCode: '400', error: HTTP_ERRORS.INVALID_REQUEST },
    { statusCode: '401', error: HTTP_ERRORS.UNAUTHORIZED },
    { statusCode: '403', error: HTTP_ERRORS.FORBIDDED },
    { statusCode: '404', error: HTTP_ERRORS.NOT_FOUND },
    { statusCode: '409', error: HTTP_ERRORS.BUSINESS_ERROR },
    { statusCode: '4xx', error: HTTP_ERRORS.CLIENT_SIDE_ERROR },
    { statusCode: '500', error: HTTP_ERRORS.INTERNAL_SERVER_ERROR },
    { statusCode: '5xx', error: HTTP_ERRORS.SERVER_SIDE_ERROR },
  ])(
    'WHEN server return HTTP status code $statusCode THEN it should return Left of correct Error',
    async ({ statusCode, error }) => {
      const httpClient = createAxiosHttpClient();

      const resp = await executeT(
        httpClient.sendRequest(createSendRequestOptions({ url: `/${statusCode}` })),
      );
      expect(resp).toEqualLeft(expect.objectContaining(error));
    },
  );

  it('WHEN error happened and no response received THEN it should return Left of correct Error', async () => {
    const httpClient = createAxiosHttpClient();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ url: '/noResponse' })));
    expect(resp).toEqualLeft(expect.objectContaining(HTTP_ERRORS.NO_RESPONSE));
  });

  it('WHEN error happened before the request has been sent THEN it should return Left of correct Error', async () => {
    const httpClient = createAxiosHttpClient({
      transformRequest: () => {
        throw new Error('Client error');
      },
    });

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions()));
    expect(resp).toEqualLeft(expect.objectContaining(HTTP_ERRORS.SENDING_FAILED));
  });
});
