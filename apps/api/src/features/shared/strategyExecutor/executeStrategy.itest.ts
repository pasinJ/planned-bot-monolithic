import { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import { Console } from 'node:console';
import { Stream } from 'stream';

import { ValidDate } from '#shared/utils/date.js';
import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { TimezoneString } from '#shared/utils/string.js';
import { mockBtStrategyModel } from '#test-utils/features/btStrategies/btStrategy.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockLoggerIo } from '#test-utils/services.js';

import { Kline } from '../kline.js';
import { OrderId } from '../order.js';
import { AssetCurrency, StrategyBody, languageEnum } from '../strategy.js';
import { buildKlinesModule } from '../strategyExecutorModules/klines.js';
import { buildOrdersModule } from '../strategyExecutorModules/orders.js';
import { initiateStrategyModule } from '../strategyExecutorModules/strategy.js';
import { buildSystemModule } from '../strategyExecutorModules/system.js';
import { buildTechnicalAnalysisModule } from '../strategyExecutorModules/technicalAnalysis.js';
import { buildTradesModules } from '../strategyExecutorModules/trades.js';
import { getStrategyExecutorConfig } from './config.js';
import { startStrategyExecutor } from './service.js';

describe('UUT: Execute strategy', () => {
  function createConsole() {
    const logs: string[] = [];
    const isolatedConsole = new Console(
      new Stream.Writable({
        write: (chunk: Buffer, _, cb) => {
          logs.push(chunk.toString().replace(/\n$/, ''));
          cb();
        },
      }),
    );
    return { logs, isolatedConsole };
  }
  async function mockStrategyExecutor() {
    const { isolatedConsole } = createConsole();
    const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
    return unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));
  }
  function mockKlinesModule() {
    return buildKlinesModule([mockKline()], '+03:00' as TimezoneString);
  }
  function mockOrdersModule() {
    const ordersModuleDeps = {
      dateService: { getCurrentDate: () => new Date('2022') as ValidDate },
      generateOrderId: () => 'qJhl3S88-7' as OrderId,
    };
    const symbol = mockBnbSymbol();
    const orders = {
      openingOrders: [],
      submittedOrders: [],
      triggeredOrders: [],
      filledOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    };

    return buildOrdersModule(ordersModuleDeps, symbol, orders);
  }
  function mockStrategyModule() {
    const symbol = mockBnbSymbol();
    const btStrategy = mockBtStrategyModel({ symbol: symbol.name });
    return initiateStrategyModule({ ...btStrategy, assetCurrency: 'BNB' as AssetCurrency }, symbol);
  }
  function mockTradesModule() {
    const trades = { openingTrades: [], closedTrades: [] };
    return buildTradesModules(trades.openingTrades, trades.closedTrades);
  }
  function mockTaModule() {
    const klines = [mockKline()] as ReadonlyNonEmptyArray<Kline>;
    return buildTechnicalAnalysisModule(klines);
  }
  function mockSystemModule() {
    const dateService = { getCurrentDate: () => new Date('2011-04-03') as ValidDate };
    const timezone = '+02:00' as TimezoneString;
    return buildSystemModule({ dateService }, timezone);
  }

  const defaultLanguage = languageEnum.javascript;
  const defaultModule = {
    klinesModule: mockKlinesModule(),
    ordersModule: mockOrdersModule(),
    tradesModule: mockTradesModule(),
    strategyModule: mockStrategyModule(),
    technicalAnalysisModule: mockTaModule(),
    systemModule: mockSystemModule(),
  };

  describe('[WHEN] execute the strategy body that access console module', () => {
    it('[THEN] it will return Right [AND] we will get log messages in the log array', async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const body = 'console.log("Hello")' as StrategyBody;
      const language = defaultLanguage;
      const modules = defaultModule;

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain('Hello');
    });
  });

  describe('[WHEN] execute the strategy body that access lodash module', () => {
    it("[THEN] it will return Right [AND] the lodash's function will work properly", async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const body = 'console.log(lodash.nth([1,2,3],-1))' as StrategyBody;
      const language = defaultLanguage;
      const modules = defaultModule;

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain('3');
    });
  });

  describe('[WHEN] execute the strategy body that access klines module', () => {
    it('[THEN] it will access correct value [AND] return Right', async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const openPrice = 0.12321;
      const kline = mockKline({ open: openPrice });
      const timezone = 'UTC' as TimezoneString;
      const klinesModule = buildKlinesModule([kline], timezone);

      const body = `
        console.log(klines.open);
        console.log(JSON.stringify(klines.getAllOpen()));
      ` as StrategyBody;
      const language = defaultLanguage;
      const modules = { ...defaultModule, klinesModule };

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain('0.12321');
      expect(logs).toContain(JSON.stringify([0.12321]));
    });
  });

  describe('[WHEN] execute the strategy body that access orders module', () => {
    it('[THEN] it will return Right [AND] work properly', async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const ordersModuleDeps = {
        dateService: { getCurrentDate: () => new Date('2022') as ValidDate },
        generateOrderId: () => 'qJhl3S88-7' as OrderId,
      };
      const symbol = mockBnbSymbol();
      const orders = {
        openingOrders: [],
        submittedOrders: [],
        triggeredOrders: [],
        filledOrders: [],
        canceledOrders: [],
        rejectedOrders: [],
      };
      const ordersModule = buildOrdersModule(ordersModuleDeps, symbol, orders);

      const body = `
        orders.enterMarket({quantity: 10});
        console.log(JSON.stringify(orders.getPendingOrders()));
      ` as StrategyBody;
      const language = defaultLanguage;
      const modules = { ...defaultModule, ordersModule };

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain(
        JSON.stringify([
          {
            orderSide: 'ENTRY',
            type: 'MARKET',
            quantity: 10,
            id: 'qJhl3S88-7',
            status: 'PENDING',
            createdAt: new Date('2022-01-01T00:00:00.000Z'),
          },
        ]),
      );
    });
  });

  describe('[WHEN] execute the strategy body that access trades module', () => {
    it('[THEN] it will return Right [AND] work properly', async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const trades = { openingTrades: [], closedTrades: [] };
      const tradesModule = buildTradesModules(trades.openingTrades, trades.closedTrades);

      const body = `
        console.log(JSON.stringify(trades.openingTrades));
        console.log(JSON.stringify(trades.winTrades));
      ` as StrategyBody;
      const language = defaultLanguage;
      const modules = { ...defaultModule, tradesModule };

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain(JSON.stringify([]));
    });
  });

  describe('[WHEN] execute the strategy body that access strategy module', () => {
    it('[THEN] it will return Right [AND] work properly', async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const symbol = mockBnbSymbol();
      const btStrategy = mockBtStrategyModel({ symbol: symbol.name });
      const strategyModule = initiateStrategyModule(
        { ...btStrategy, assetCurrency: 'BNB' as AssetCurrency },
        symbol,
      );

      const body = `
        console.log(strategy.name);
        console.log(strategy.initialCapital);
      ` as StrategyBody;
      const language = defaultLanguage;
      const modules = { ...defaultModule, strategyModule };

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain(strategyModule.name.toString());
      expect(logs).toContain(strategyModule.initialCapital.toString());
    });
  });

  describe('[WHEN] execute the strategy body that access technical analysis module', () => {
    it('[THEN] it will return Right [AND] work properly', async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const klines = [mockKline()] as ReadonlyNonEmptyArray<Kline>;
      const technicalAnalysisModule = buildTechnicalAnalysisModule(klines);

      const body = `
        console.log(ta.highest([2,1,3,5], 2));
        console.log(JSON.stringify(ta.volume.pvt()));
      ` as StrategyBody;
      const language = defaultLanguage;
      const modules = { ...defaultModule, technicalAnalysisModule };

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain('5');
      expect(logs).toContain(JSON.stringify([NaN]));
    });
  });

  describe('[WHEN] execute the strategy body that access system module', () => {
    it('[THEN] it will return Right [AND] work properly', async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const dateService = { getCurrentDate: () => new Date('2011-04-03') as ValidDate };
      const timezone = '+02:00' as TimezoneString;
      const systemModule = buildSystemModule({ dateService }, timezone);

      const body = `
        console.log(system.getDay());
        console.log(system.getHours());
      ` as StrategyBody;
      const language = defaultLanguage;
      const modules = { ...defaultModule, systemModule };

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain('3');
      expect(logs).toContain('2');
    });
  });

  describe('[WHEN] execute the strategy body that uses async/await syntax', () => {
    it('[THEN] it will return Right [AND] work properly', async () => {
      const { logs, isolatedConsole } = createConsole();
      const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
      const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

      const body = `console.log(await Promise.resolve('Hello'));` as StrategyBody;
      const language = defaultLanguage;
      const modules = defaultModule;

      const result = await executeT(strategyExecutor.execute(body, language, modules));

      expect(result).toBeRight();
      expect(logs).toContain('Hello');
    });
  });

  describe('[GIVEN] language is typescript', () => {
    describe('[WHEN] execute the strategy body', () => {
      it('[THEN] it will return Right [AND] work properly', async () => {
        const { logs, isolatedConsole } = createConsole();
        const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
        const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

        const body = 'const a: string = ""; console.log(a);' as StrategyBody;
        const language = languageEnum.typescript;
        const modules = defaultModule;

        const result = await executeT(strategyExecutor.execute(body, language, modules));

        expect(result).toBeRight();
        expect(logs).toContain('');
      });
    });
  });

  describe('[GIVEN] language is typescript [AND] strategy body uses async/await syntax', () => {
    describe('[WHEN] execute the strategy body', () => {
      it('[THEN] it will return Right [AND] work properly', async () => {
        const { logs, isolatedConsole } = createConsole();
        const deps = { isolatedConsole, loggerIo: mockLoggerIo(), getConfig: getStrategyExecutorConfig };
        const strategyExecutor = unsafeUnwrapEitherRight(await executeT(startStrategyExecutor(deps)));

        const body = `console.log(await Promise.resolve('Hello'));` as StrategyBody;
        const language = languageEnum.typescript;
        const modules = defaultModule;

        const result = await executeT(strategyExecutor.execute(body, language, modules));

        expect(result).toBeRight();
        expect(logs).toContain('Hello');
      });
    });
  });

  describe('[GIVEN] strategy body is valid [AND] there is no pending order request be created', () => {
    describe('[WHEN] execute the strategy body', () => {
      it('[THEN] it will return Right of empty array', async () => {
        const strategyExecutor = await mockStrategyExecutor();

        const body = 'console.log("Hello")' as StrategyBody;
        const language = languageEnum.typescript;
        const modules = defaultModule;

        const result = await executeT(strategyExecutor.execute(body, language, modules));

        expect(result).toEqualRight([]);
      });
    });
  });

  describe('[GIVEN] strategy body is valid [AND] there is a pending order request be created', () => {
    describe('[WHEN] execute the strategy body', () => {
      it('[THEN] it will return Right of an array that contains the pending order request', async () => {
        const strategyExecutor = await mockStrategyExecutor();

        const body = 'orders.enterMarket({quantity: 5})' as StrategyBody;
        const language = languageEnum.typescript;
        const modules = defaultModule;

        const result = await executeT(strategyExecutor.execute(body, language, modules));

        expect(result).toEqualRight([
          {
            orderSide: 'ENTRY',
            type: 'MARKET',
            quantity: 5,
            id: 'qJhl3S88-7',
            status: 'PENDING',
            createdAt: new Date('2022-01-01T00:00:00.000Z'),
          },
        ]);
      });
    });
  });
});
