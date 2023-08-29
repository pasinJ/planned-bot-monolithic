import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import { exchangeEnum } from '#features/shared/domain/exchange';
import { Symbol } from '#features/symbols/domain/symbol.valueObject';

import { anyString } from './faker';

export function mockSymbol(): Symbol {
  const baseAsset = anyString().toUpperCase();
  const quoteAsset = anyString().toUpperCase();

  return {
    name: baseAsset + quoteAsset,
    exchange: faker.helpers.arrayElement(values(exchangeEnum)),
    baseAsset,
    quoteAsset,
  } as Symbol;
}
