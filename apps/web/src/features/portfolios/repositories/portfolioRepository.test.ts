import { faker } from '@faker-js/faker';
import * as e from 'fp-ts/lib/Either';

import { mockHttpClient, mockPortfolio } from '#test-utils/mock';
import { executeT } from '#utils/fpExecute';

import { createPortfolio, getPortfolios } from './portfolioRepository';

describe('Get portfolios', () => {
  describe('WHEN get portfolio and HTTP client return Right', () => {
    it('THEN it should return Right with the same value inside', async () => {
      const value = faker.number.int();
      const { httpClient } = mockHttpClient({ sendRequest: e.right(value) });

      const result = await executeT(getPortfolios({ httpClient }));
      expect(result).toEqualRight(value);
    });
  });

  describe('WHEN get portfolio and HTTP client return Left', () => {
    it('THEN it should return Left of GET_PORTFOLIO_ERROR', async () => {
      const value = faker.number.int();
      const { httpClient } = mockHttpClient({ sendRequest: e.left(value) });

      const result = await executeT(getPortfolios({ httpClient }));
      expect(result).toEqualLeft(expect.objectContaining({ name: 'GET_PORTFOLIOS_ERROR' }));
    });
  });
});

describe('Create portfolio', () => {
  function mockRequestBody() {
    return {
      initialCapital: faker.number.float({ min: 0, max: 1000, precision: 0.00000001 }),
      takerFee: faker.number.float({ min: 0, max: 100, precision: 0.00001 }),
      makerFee: faker.number.float({ min: 0, max: 100, precision: 0.00001 }),
    };
  }

  describe('WHEN create portfolio', () => {
    it('THEN it should pass body to HTTP client', async () => {
      const body = mockRequestBody();
      const portfolio = mockPortfolio(body);
      const { httpClient } = mockHttpClient({ sendRequest: e.right(portfolio) });

      await executeT(createPortfolio(body, { httpClient }));
      expect(httpClient.sendRequest).toHaveBeenCalledWith(expect.objectContaining({ body }));
    });
  });
  describe('WHEN create portfolio and HTTP client return Right', () => {
    it('THEN it should return Right with the same value inside', async () => {
      const body = mockRequestBody();
      const portfolio = mockPortfolio(body);
      const { httpClient } = mockHttpClient({ sendRequest: e.right(portfolio) });

      const result = await executeT(createPortfolio(body, { httpClient }));
      expect(result).toEqualRight(portfolio);
    });
  });
  describe('WHEN create portfolio and HTTP client return Left', () => {
    it('THEN it should return Left of CREATE_PORTFOLIO_ERROR', async () => {
      const body = mockRequestBody();
      const error = new Error();
      const { httpClient } = mockHttpClient({ sendRequest: e.left(error) });

      const result = await executeT(createPortfolio(body, { httpClient }));
      expect(result).toEqualLeft(expect.objectContaining({ name: 'CREATE_PORTFOLIO_ERROR' }));
    });
  });
});
