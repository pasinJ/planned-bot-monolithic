import { format } from 'date-fns';
import te from 'fp-ts/lib/TaskEither.js';
import { allPass, includes, mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createHttpError, isHttpError } from '#infra/http/client.error.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { createFileServiceError, isFileServiceError } from '#infra/services/file/error.js';
import { DayString, MonthString, YearString } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { randomDate } from '#test-utils/faker/date.js';
import { randomBtExecutionId } from '#test-utils/features/btStrategies/models.js';
import { randomTimeframe } from '#test-utils/features/shared/domain.js';
import { randomSymbolName } from '#test-utils/features/symbols/models.js';

import { DownloadKlinesZipFileDeps, downloadKlinesZipFile } from './downloadKlinesZipFile.js';

function mockDeps(overrides?: DeepPartial<DownloadKlinesZipFileDeps>): DownloadKlinesZipFileDeps {
  return mergeDeepRight(
    {
      httpClient: { downloadFile: jest.fn().mockReturnValue(te.right(undefined)) },
      fileService: { extractZipFile: jest.fn().mockReturnValue(te.right(undefined)) },
    },
    overrides ?? {},
  ) as DownloadKlinesZipFileDeps;
}
function createMonthlyFileRequest() {
  const date = randomDate();
  return {
    executionId: randomBtExecutionId(),
    symbol: randomSymbolName(),
    timeframe: randomTimeframe(),
    year: format(date, 'yyyy') as YearString,
    month: format(date, 'MM') as MonthString,
  };
}
function createDailyFileRequest() {
  const date = randomDate();
  return {
    executionId: randomBtExecutionId(),
    symbol: randomSymbolName(),
    timeframe: randomTimeframe(),
    year: format(date, 'yyyy') as YearString,
    month: format(date, 'MM') as MonthString,
    day: format(date, 'dd') as DayString,
  };
}

const httpError = createHttpError('ServerSideError', 'Mock', new Error());
const extractFailedError = createFileServiceError('ExtractFileFailed', 'Mock');

describe('[WHEN] download klines monthly file', () => {
  it('[THEN] it will download file with correct options', async () => {
    const deps = mockDeps();
    const request = createMonthlyFileRequest();

    await executeT(downloadKlinesZipFile(deps, request));

    const { PUBLIC_DATA_BASE_URL, DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
    expect(deps.httpClient.downloadFile).toHaveBeenCalledExactlyOnceWith({
      method: 'GET',
      url: expect.toSatisfy(
        allPass([
          includes(PUBLIC_DATA_BASE_URL),
          includes(request.symbol),
          includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
          includes(request.year),
          includes(request.month),
        ]),
      ),
      outputPath: expect.toSatisfy(
        allPass([
          includes(DOWNLOAD_OUTPUT_PATH),
          includes(request.executionId),
          includes(request.symbol),
          includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
          includes(request.year),
          includes(request.month),
          includes('.zip'),
        ]),
      ),
    });
  });
  it('[THEN] it will extract the downloaded zip file', async () => {
    const deps = mockDeps();
    const request = createMonthlyFileRequest();

    await executeT(downloadKlinesZipFile(deps, request));

    expect(deps.fileService.extractZipFile).toHaveBeenCalledExactlyOnceWith(
      expect.toInclude('.zip'),
      expect.toInclude('.csv'),
    );
  });
  it('[THEN] it will return Right of CSV file path', async () => {
    const deps = mockDeps();
    const request = createMonthlyFileRequest();

    const result = await executeT(downloadKlinesZipFile(deps, request));

    const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
    expect(result).toEqualRight(
      expect.toSatisfy(
        allPass([
          includes(DOWNLOAD_OUTPUT_PATH),
          includes(request.executionId),
          includes(request.symbol),
          includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
          includes(request.year),
          includes(request.month),
          includes('.csv'),
        ]),
      ),
    );
  });
});

describe('[WHEN] download klines daily file', () => {
  it('[THEN] it will download file with correct options', async () => {
    const deps = mockDeps();
    const request = createDailyFileRequest();

    await executeT(downloadKlinesZipFile(deps, request));

    const { PUBLIC_DATA_BASE_URL, DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
    expect(deps.httpClient.downloadFile).toHaveBeenCalledExactlyOnceWith({
      method: 'GET',
      url: expect.toSatisfy(
        allPass([
          includes(PUBLIC_DATA_BASE_URL),
          includes(request.symbol),
          includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
          includes(request.year),
          includes(request.month),
          includes(request.day),
        ]),
      ),
      outputPath: expect.toSatisfy(
        allPass([
          includes(DOWNLOAD_OUTPUT_PATH),
          includes(request.executionId),
          includes(request.symbol),
          includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
          includes(request.year),
          includes(request.month),
          includes(request.day),
        ]),
      ),
    });
  });
  it('[THEN] it will extract the downloaded zip file', async () => {
    const deps = mockDeps();
    const request = createDailyFileRequest();

    await executeT(downloadKlinesZipFile(deps, request));

    expect(deps.fileService.extractZipFile).toHaveBeenCalledExactlyOnceWith(
      expect.toInclude('.zip'),
      expect.toInclude('.csv'),
    );
  });
  it('[THEN] it will return Right of CSV file path', async () => {
    const deps = mockDeps();
    const request = createDailyFileRequest();

    const result = await executeT(downloadKlinesZipFile(deps, request));

    const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
    expect(result).toEqualRight(
      expect.toSatisfy(
        allPass([
          includes(DOWNLOAD_OUTPUT_PATH),
          includes(request.executionId),
          includes(request.symbol),
          includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
          includes(request.year),
          includes(request.month),
          includes('.csv'),
        ]),
      ),
    );
  });
});

describe('[WHEN] download klines monthly file [BUT] HTTP client return error', () => {
  it('[THEN] it will return Left of error', async () => {
    const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });

    const result = await executeT(downloadKlinesZipFile(deps, createMonthlyFileRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isHttpError));
  });
});

describe('[WHEN] download klines daily file [BUT] HTTP client return error', () => {
  it('[THEN] it will return Left of error', async () => {
    const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });

    const result = await executeT(downloadKlinesZipFile(deps, createDailyFileRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isHttpError));
  });
});

describe('[WHEN] download klines monthly file [BUT] extracting zip file fails', () => {
  it('[THEN] it will return Left of error', async () => {
    const deps = mockDeps({ fileService: { extractZipFile: () => te.left(extractFailedError) } });

    const result = await executeT(downloadKlinesZipFile(deps, createMonthlyFileRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
  });
});

describe('[WHEN] download klines daily file [BUT] extracting zip file fails', () => {
  it('[THEN] it will return Left of error', async () => {
    const deps = mockDeps({ fileService: { extractZipFile: () => te.left(extractFailedError) } });

    const result = await executeT(downloadKlinesZipFile(deps, createDailyFileRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
  });
});
