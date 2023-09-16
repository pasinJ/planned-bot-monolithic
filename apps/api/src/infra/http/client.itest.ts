import { faker } from '@faker-js/faker';
import { existsSync, readFileSync } from 'fs';
import { mkdir, rmdir } from 'fs/promises';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import path from 'path';
import { zipObj } from 'ramda';
import { z } from 'zod';

import { executeT } from '#shared/utils/fp.js';
import { generateArrayOf, randomString } from '#test-utils/faker.js';
import { mockLoggerIo } from '#test-utils/services.js';

import { HTTP_ERRORS } from './client.constant.js';
import { isHttpError } from './client.error.js';
import { buildAxiosHttpClient as buildAxiosHttpClientOrg } from './client.js';
import { HttpClient, HttpMethod } from './client.type.js';

function buildAxiosHttpClient(config?: Parameters<typeof buildAxiosHttpClientOrg>[1]) {
  return buildAxiosHttpClientOrg(mockLoggerIo(), config);
}

const BASE_URL = 'http://localhost';
const baseOutputPath = path.resolve('./downloads');
const msw = setupServer();

beforeAll(() =>
  msw.listen({
    onUnhandledRequest: ({ method, url }) => {
      if (!url.pathname.startsWith('/noResponse'))
        // eslint-disable-next-line no-console
        console.warn('Found an unhandled %s request to %s', method, url.href);
    },
  }),
);
afterAll(() => msw.close());

describe('Axios HTTP client send request', () => {
  function randomUrl(prefix = '/echo') {
    return prefix + '/' + faker.word.noun();
  }
  function randomObject() {
    return zipObj(
      generateArrayOf(() => faker.word.noun(), 3),
      generateArrayOf(() => faker.word.noun(), 3),
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

  beforeAll(() =>
    msw.use(
      rest.all(`${BASE_URL}/200`, (_, res, ctx) => res(ctx.status(200), ctx.json({ success: true }))),
      rest.all(`${BASE_URL}/400`, (_, res, ctx) => res(ctx.status(400))),
      rest.all(`${BASE_URL}/401`, (_, res, ctx) => res(ctx.status(401))),
      rest.all(`${BASE_URL}/403`, (_, res, ctx) => res(ctx.status(403))),
      rest.all(`${BASE_URL}/404`, (_, res, ctx) => res(ctx.status(404))),
      rest.all(`${BASE_URL}/409`, (_, res, ctx) => res(ctx.status(409))),
      rest.all(`${BASE_URL}/4xx`, (_, res, ctx) => res(ctx.status(410))),
      rest.all(`${BASE_URL}/500`, (_, res, ctx) => res(ctx.status(500))),
      rest.all(`${BASE_URL}/5xx`, (_, res, ctx) => res(ctx.status(501))),
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
    ),
  );
  afterAll(() => msw.resetHandlers());

  it('WHEN request with specific url THEN HTTP client should also send out request to that url', async () => {
    const httpClient = buildAxiosHttpClient();
    const url = randomUrl();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ url })));
    expect(resp).toBeRight();
    expect(resp).toHaveProperty('right.url', expect.stringContaining(url));
  });

  it.each<{ method: HttpMethod }>([
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
      const httpClient = buildAxiosHttpClient();

      const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ method })));
      expect(resp).toEqualRight(expect.objectContaining({ method }));
    },
  );

  it('WHEN request with headers THEN HTTP client should also send out request with that headers', async () => {
    const httpClient = buildAxiosHttpClient();
    const headers = randomObject();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ headers })));
    expect(resp).toBeRight();
    expect(resp).toHaveProperty('right.headers', expect.objectContaining(headers));
  });

  it('WHEN request with params THEN HTTP client should also send out request with that params', async () => {
    const httpClient = buildAxiosHttpClient();
    const params = randomObject();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ params })));
    expect(resp).toBeRight();
    expect(resp).toHaveProperty('right.params', params);
  });

  it('WHEN request with body THEN HTTP client should also send out request with that body', async () => {
    const httpClient = buildAxiosHttpClient();
    const body = randomObject();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ body })));
    expect(resp).toBeRight();
    expect(resp).toHaveProperty('right.body', body);
  });

  it('WHEN response body match the given schema THEN it should return Right of response body', async () => {
    const httpClient = buildAxiosHttpClient();

    const resp = await executeT(
      httpClient.sendRequest(
        createSendRequestOptions({ url: '/200', responseSchema: z.object({ success: z.boolean() }) }),
      ),
    );
    expect(resp).toEqualRight({ success: true });
  });

  it('WHEN response body does not match the given schema THEN it should return Left of Error', async () => {
    const httpClient = buildAxiosHttpClient();

    const resp = await executeT(
      httpClient.sendRequest(
        createSendRequestOptions({ url: '/200', responseSchema: z.object({ success: z.string() }) }),
      ),
    );
    expect(resp).toEqualLeft(expect.objectContaining(HTTP_ERRORS.InvalidResponse));
  });

  it.each([
    { statusCode: '400', error: HTTP_ERRORS.InvalidRequest },
    { statusCode: '401', error: HTTP_ERRORS.Unauthorized },
    { statusCode: '403', error: HTTP_ERRORS.Forbidded },
    { statusCode: '404', error: HTTP_ERRORS.NotFound },
    { statusCode: '409', error: HTTP_ERRORS.BussinessError },
    { statusCode: '4xx', error: HTTP_ERRORS.ClientSideError },
    { statusCode: '500', error: HTTP_ERRORS.InternalServerError },
    { statusCode: '5xx', error: HTTP_ERRORS.ServerSideError },
  ])(
    'WHEN server return HTTP status code $statusCode THEN it should return Left of correct Error',
    async ({ statusCode, error }) => {
      const httpClient = buildAxiosHttpClient();

      const resp = await executeT(
        httpClient.sendRequest(createSendRequestOptions({ url: `/${statusCode}` })),
      );
      expect(resp).toEqualLeft(expect.objectContaining(error));
    },
  );

  it('WHEN error happened and no response received THEN it should return Left of correct Error', async () => {
    const httpClient = buildAxiosHttpClient();

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions({ url: '/noResponse' })));
    expect(resp).toEqualLeft(expect.objectContaining(HTTP_ERRORS.NoResponse));
  });

  it('WHEN error happened before the request has been sent THEN it should return Left of correct Error', async () => {
    const httpClient = buildAxiosHttpClient({
      transformRequest: () => {
        throw new Error('Client error');
      },
    });

    const resp = await executeT(httpClient.sendRequest(createSendRequestOptions()));
    expect(resp).toEqualLeft(expect.objectContaining(HTTP_ERRORS.SendingFailed));
  });
});

describe('Axios HTTP client download file', () => {
  function serverReturnFile(url: string) {
    msw.use(
      rest.get(`${BASE_URL}${url}`, async (req, res, ctx) => {
        const buffer = readFileSync('./test-utils/klines.zip');
        return res(
          ctx.set('Content-Length', buffer.byteLength.toString()),
          ctx.set('Content-Type', 'application/zip'),
          ctx.body(buffer),
        );
      }),
    );
  }

  const httpClient = buildAxiosHttpClient();

  afterEach(async () => {
    msw.resetHandlers();
    await rmdir('./downloads', { recursive: true });
    await mkdir('./downloads');
  });

  describe('WHEN server return HTTP error', () => {
    it('THEN it should return Left of error', async () => {
      const url = '/' + faker.word.noun();
      msw.use(rest.get(`${BASE_URL}${url}`, (_, res, ctx) => res(ctx.status(404))));

      const outputPath = baseOutputPath + '/' + randomString();
      const result = await executeT(httpClient.downloadFile({ method: 'GET', url, outputPath }));

      expect(result).toEqualLeft(expect.toSatisfy(isHttpError));
    });
  });

  describe('WHEN server return HTTP file', () => {
    it('THEN it should write file to the output path', async () => {
      const url = '/' + faker.word.noun();
      serverReturnFile(url);

      const outputPath = baseOutputPath + '/' + randomString();
      await executeT(httpClient.downloadFile({ method: 'GET', url, outputPath }));

      expect(existsSync(outputPath)).toBeTrue();
    });
    it('THEN it should return Right of undefined', async () => {
      const url = '/' + faker.word.noun();
      serverReturnFile(url);

      const outputPath = baseOutputPath + '/' + randomString();
      const result = await executeT(httpClient.downloadFile({ method: 'GET', url, outputPath }));

      expect(result).toEqualRight(undefined);
    });
  });
});
