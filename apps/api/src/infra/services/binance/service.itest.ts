import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { pino } from 'pino';
import { mergeDeepRight } from 'ramda';

import { DeepPartial } from '#shared/common.type.js';
import { executeT } from '#shared/utils/fp.js';
import { randomAnyDate, randomString } from '#test-utils/faker.js';

import { getBnbConfig } from './config.js';
import { BNB_ENDPOINT_PATHS } from './constants.js';
import { isBnbServiceError } from './error.js';
import { BnbServiceDeps, createBnbService } from './service.js';

function mockDeps(overrides?: DeepPartial<BnbServiceDeps>): BnbServiceDeps {
  return mergeDeepRight(
    {
      symbolModelDao: { generateId: jest.fn().mockReturnValue(randomString()) },
      dateService: { getCurrentDate: jest.fn().mockReturnValue(randomAnyDate()) },
      mainLogger: pino({ enabled: false }),
    },
    overrides ?? {},
  ) as BnbServiceDeps;
}

const { HTTP_BASE_URL } = getBnbConfig();
const { ping } = BNB_ENDPOINT_PATHS;
const pingPath = `${HTTP_BASE_URL}${ping}`;

const msw = setupServer(rest.get(pingPath, (_, res, ctx) => res(ctx.status(200), ctx.json({}))));

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('Create Binance service', () => {
  describe('WHEN successfully create Binance service', () => {
    it('THEN it should return Right of Binance service', async () => {
      const result = await executeT(createBnbService(mockDeps()));
      expect(result).toEqualRight(expect.toContainAllKeys(['getSpotSymbols']));
    });
  });
  describe('WHEN unsuccessfully create Binance service (test connection failed)', () => {
    it('THEN it should return Left of Binance service error', async () => {
      msw.use(rest.get(pingPath, (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(createBnbService(mockDeps()));
      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});
