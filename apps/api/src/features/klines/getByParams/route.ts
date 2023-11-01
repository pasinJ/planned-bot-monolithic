import { RouteOptions } from 'fastify';

import { getKlinesByApi } from '#features/btStrategies/services/binance/getKlinesByApi.js';
import { getKlinesByDailyFiles } from '#features/btStrategies/services/binance/getKlinesByDailyFiles.js';
import { getKlinesByMonthlyFiles } from '#features/btStrategies/services/binance/getKlinesByMonthlyFiles.js';
import { getKlinesForBt } from '#features/btStrategies/services/binance/getKlinesForBt.js';
import { createDirectory } from '#features/btStrategies/services/file/createDirectory.js';
import { extractZipFile } from '#features/btStrategies/services/file/extractZipFile.js';
import { readCsvFile } from '#features/btStrategies/services/file/readCsvFile.js';
import { removeDirectory } from '#features/btStrategies/services/file/removeDirectory.js';
import { getSymbolModelByNameAndExchange } from '#features/symbols/DAOs/symbol.feature.js';
import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { addKlines, countKlines, getKlines } from '../DAOs/kline.feature.js';
import { KLINE_ENDPOINTS } from '../routes.constant.js';
import { buildGetKlinesByQueryController } from './controller.js';

export function getKlinesByParamsRouteOptions(deps: AppDeps): RouteOptions {
  const { symbolDao, klineDao, bnbService } = deps;
  const getKlinesFromApi = bnbService.composeWith(getKlinesByApi);
  const getKlinesFromDailyFiles = bnbService.composeWith(({ httpClient }) =>
    getKlinesByDailyFiles({
      httpClient,
      fileService: { extractZipFile, readCsvFile },
      bnbService: { getConfig: getBnbConfig, getKlinesByApi: getKlinesFromApi },
    }),
  );
  const getKlinesFromMonthlyFiles = bnbService.composeWith(({ httpClient }) =>
    getKlinesByMonthlyFiles({
      httpClient,
      fileService: { extractZipFile, readCsvFile },
      bnbService: {
        getConfig: getBnbConfig,
        getKlinesByApi: getKlinesFromApi,
        getKlinesByDailyFiles: getKlinesFromDailyFiles,
      },
    }),
  );

  return {
    ...KLINE_ENDPOINTS.GET_BY_PARAMS,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetKlinesByQueryController({
      symbolDao: { getByNameAndExchange: symbolDao.composeWith(getSymbolModelByNameAndExchange) },
      klineDao: {
        count: klineDao.composeWith(countKlines),
        get: klineDao.composeWith(getKlines),
        add: klineDao.composeWith(addKlines),
      },
      bnbService: {
        downloadKlines: getKlinesForBt({
          bnbService: {
            getConfig: getBnbConfig,
            getKlinesByApi: getKlinesFromApi,
            getKlinesByDailyFiles: getKlinesFromDailyFiles,
            getKlinesByMonthlyFiles: getKlinesFromMonthlyFiles,
          },
          fileService: { createDirectory, removeDirectory },
        }),
      },
    }),
  };
}
