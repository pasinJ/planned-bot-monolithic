import { faker } from '@faker-js/faker';
import te from 'fp-ts/lib/TaskEither.js';
import fs from 'fs';
import { mkdir, readdir, rmdir } from 'fs/promises';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { dissoc, values } from 'ramda';

import { SymbolName } from '#features/shared/domain/symbolName.js';
import { timeframeEnum } from '#features/shared/domain/timeframe.js';
import { createHttpError } from '#infra/http/client.error.js';
import { buildAxiosHttpClient } from '#infra/http/client.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { executeT } from '#shared/utils/fp.js';
import { randomTimeframe } from '#test-utils/domain.js';
import { randomString } from '#test-utils/faker.js';
import { mockLoggerIo } from '#test-utils/services.js';

import { Month, Year, downloadMonthlyKlinesZipFile } from './binance.js';

const { PUBLIC_DATA_BASE_URL } = getBnbConfig();
const msw = setupServer();

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('Download monthly klines zip file', () => {
  function mockDeps() {
    return {
      httpClient: buildAxiosHttpClient(mockLoggerIo(), {
        baseURL: PUBLIC_DATA_BASE_URL,
        responseType: 'arraybuffer',
      }),
    };
  }
  function mockRequest() {
    return {
      symbol: randomString() as SymbolName,
      timeframe: randomTimeframe(),
      year: randomString() as Year,
      month: randomString() as Month,
    };
  }
  function mockServer() {
    msw.use(
      rest.get(new RegExp(`^${PUBLIC_DATA_BASE_URL}`), async (req, res, ctx) => {
        const buffer = fs.readFileSync('./test-utils/klines.zip');
        return res(
          ctx.set('Content-Length', buffer.byteLength.toString()),
          ctx.set('Content-Type', 'application/zip'),
          ctx.body(buffer),
        );
      }),
    );
  }

  afterEach(async () => {
    await rmdir('./downloads', { recursive: true });
    await mkdir('./downloads');
  });

  describe('WHEN download monthly file with timeframe other than 1M', () => {
    it('THEN it should send request to the correct url', async () => {
      const request = {
        ...mockRequest(),
        timeframe: faker.helpers.arrayElement(values(dissoc('1M', timeframeEnum))),
      };
      const url = `/data/spot/monthly/klines/${request.symbol.toUpperCase()}/${
        request.timeframe
      }/${request.symbol.toUpperCase()}-${request.timeframe}-${request.year}-${request.month}.zip`;

      const error = createHttpError('UnhandledError', 'Mock', new Error());
      const deps = { httpClient: { downloadFile: jest.fn().mockReturnValue(te.left(error)) } };
      await executeT(downloadMonthlyKlinesZipFile(deps, request));

      expect(deps.httpClient.downloadFile).toHaveBeenCalledWith(expect.objectContaining({ url }));
    });
  });
  describe('WHEN download monthly file with 1M timeframe', () => {
    it('THEN it should send request to the correct url', async () => {
      const request = { ...mockRequest(), timeframe: timeframeEnum['1M'] };
      const url = `/data/spot/monthly/klines/${request.symbol.toUpperCase()}/1mo/${request.symbol.toUpperCase()}-1mo-${
        request.year
      }-${request.month}.zip`;

      const error = createHttpError('UnhandledError', 'Mock', new Error());
      const deps = { httpClient: { downloadFile: jest.fn().mockReturnValue(te.left(error)) } };
      await executeT(downloadMonthlyKlinesZipFile(deps, request));

      expect(deps.httpClient.downloadFile).toHaveBeenCalledWith(expect.objectContaining({ url }));
    });
  });

  describe('WHEN download file fails', () => {
    it('THEN it should return Left of error', async () => {
      msw.use(
        rest.get(new RegExp(`^${PUBLIC_DATA_BASE_URL}`), async (_, res, ctx) => {
          return res(ctx.status(500), ctx.body(''));
        }),
      );

      const result = await executeT(downloadMonthlyKlinesZipFile(mockDeps(), mockRequest()));

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });

  describe('GIVEN file does not exist on the server WHEN download file', () => {
    it('THEN it should return Right of input', async () => {
      msw.use(
        rest.get(new RegExp(`^${PUBLIC_DATA_BASE_URL}`), async (_, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
                <Error>
                    <Code>NoSuchKey</Code>
                    <Message>The specified key does not exist.</Message>
                    <Key>data/spot/monthly/klines/BNBUSDT/1d/BNBUSDT-1d-2023-10.zip</Key>
                    <RequestId>GENJ0YCEJYJ1F0FW</RequestId>
                    <HostId>lpZCOefZOBZRoW7SA1EBpBMpupsk2VafjdmfVlLQipL/AKR2iZ0ZvBkbYrOKPQApZVt2KO6eTBY=</HostId>
                </Error>`),
          );
        }),
      );

      const request = mockRequest();
      const result = await executeT(downloadMonthlyKlinesZipFile(mockDeps(), request));

      expect(result).toEqualRight(request);
    });
  });

  describe('GIVEN file exists WHEN download file', () => {
    it('THEN it should download file into local disk and unzip file', async () => {
      mockServer();

      await executeT(downloadMonthlyKlinesZipFile(mockDeps(), mockRequest()));

      await expect(readdir('./downloads')).resolves.toHaveLength(2);
    });
    it('THEN it should return Right of zip file and csv file paths', async () => {
      mockServer();

      const result = await executeT(downloadMonthlyKlinesZipFile(mockDeps(), mockRequest()));

      expect(result).toEqualRight({
        zipFilePath: expect.toInclude('.zip'),
        csvFilePath: expect.toInclude('.csv'),
      });
    });
  });
});
