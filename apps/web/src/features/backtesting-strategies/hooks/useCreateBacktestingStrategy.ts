import { UseMutationResult, useMutation } from '@tanstack/react-query';
import * as e from 'fp-ts/lib/Either';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';
import { z } from 'zod';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#utils/fp';
import { SchemaValidationError, parseWithZod } from '#utils/zod';

import { FormValues } from '../containers/CreateBacktestingStrategyForm/constants';
import { BacktestingStrategy } from '../domain/backtestingStrategy.entity';
import { createBacktestingStrategy } from '../repositories/backtestingStrategy';
import {
  CreateBacktestingStrategy,
  CreateBacktestingStrategyError,
} from '../repositories/backtestingStrategy.type';

export default function useCreateBacktestingStrategy(): UseMutationResult<
  BacktestingStrategy,
  CreateBacktestingStrategyError | SchemaValidationError,
  FormValues
> {
  const { httpClient } = useContext(InfraContext);

  return useMutation({
    mutationFn: (data) =>
      executeTeToPromise(
        pipe(
          parseMutationData(data),
          te.fromEither,
          te.chainW((parsedData) => createBacktestingStrategy(parsedData, { httpClient })),
        ),
      ),
  });
}

function parseMutationData(
  data: FormValues,
): e.Either<SchemaValidationError, Parameters<CreateBacktestingStrategy>[0]> {
  return parseWithZod(
    z
      .object({
        maxNumKlines: z.coerce.number(),
        initialCapital: z.coerce.number(),
        takerFeeRate: z.coerce.number(),
        makerFeeRate: z.coerce.number(),
      })
      .passthrough(),
    'Parsing data for backtesting strategy creation failed',
    data,
  ) as e.Either<SchemaValidationError, Parameters<CreateBacktestingStrategy>[0]>;
}
