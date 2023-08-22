import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { executeT } from '#shared/utils/fp.js';

import { createBinanceService } from './binanceService.js';

const msw = setupServer();
const pingPath = 'https://api.binance.com/api/v3/ping';

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('Create Binance service', () => {
  describe('WHEN successfully create Binance service', () => {
    it('THEN it should return Right', async () => {
      msw.use(rest.get(pingPath, (_, res, ctx) => res(ctx.status(200), ctx.json({}))));

      const repository = await executeT(createBinanceService);
      expect(repository).toBeRight();
    });
  });
  describe('WHEN unsuccessfully create Binance service (test connection failed)', () => {
    it('THEN it should return Left of CREATE_BINANCE_SERVICE_ERROR', async () => {
      msw.use(rest.get(pingPath, (_, res, ctx) => res(ctx.status(500))));

      const repository = await executeT(createBinanceService);
      expect(repository).toSubsetEqualLeft({ name: 'CREATE_BINANCE_SERVICE_ERROR' });
    });
  });
});
