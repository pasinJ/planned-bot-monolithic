import te from 'fp-ts/lib/TaskEither.js';
import { flow } from 'fp-ts/lib/function.js';
import { isEmpty, keys, mergeDeepRight, symmetricDifference } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockBtStrategyModel } from '#test-utils/features/btStrategies/btStrategy.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { GetBtStrategiesControllerDeps, buildGetBtStrategiesController } from './controller.js';

function mockDeps(overrides?: DeepPartial<GetBtStrategiesControllerDeps>): GetBtStrategiesControllerDeps {
  return mergeDeepRight<GetBtStrategiesControllerDeps, DeepPartial<GetBtStrategiesControllerDeps>>(
    { getBtStrategies: te.right(generateArrayOf(mockBtStrategyModel)) },
    overrides ?? {},
  );
}

const { method, url: urlTemplate } = BT_STRATEGY_ENDPOINTS.GET_BT_STRATEGIES;
const setupServer = setupTestServer(method, urlTemplate, buildGetBtStrategiesController, mockDeps);

describe('[GIVEN] there is no backtesting strategy exists', () => {
  describe('[WHEN] get backtesting strategies', () => {
    it('[THEN] it will return HTTP200 with an empty array', async () => {
      const httpServer = setupServer({ getBtStrategies: te.right([]) });

      const resp = await httpServer.inject({ method, url: urlTemplate });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toEqual([]);
    });
  });
});

describe('[GIVEN] there are some backtesting strategies exist', () => {
  describe('[WHEN] get backtesting strategies', () => {
    it('[THEN] it will return HTTP200 with an array of backtesting strategies', async () => {
      const btStrategies = generateArrayOf(mockBtStrategyModel);
      const httpServer = setupServer({ getBtStrategies: te.right(btStrategies) });

      const resp = await httpServer.inject({ method, url: urlTemplate });

      expect(resp.statusCode).toBe(200);
      const respBody = resp.json();
      expect(respBody).toHaveLength(btStrategies.length);
      expect(respBody).toSatisfyAll(
        flow(
          keys,
          symmetricDifference([
            'id',
            'name',
            'exchange',
            'symbol',
            'timeframe',
            'initialCapital',
            'assetCurrency',
            'capitalCurrency',
            'takerFeeRate',
            'makerFeeRate',
            'maxNumKlines',
            'btRange',
            'timezone',
            'language',
            'body',
            'version',
            'createdAt',
            'updatedAt',
          ]),
          isEmpty,
        ),
      );
    });
  });
});
