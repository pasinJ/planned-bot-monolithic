import { UseMutationResult, useMutation } from '@tanstack/react-query';
import * as e from 'fp-ts/lib/Either';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';
import { z } from 'zod';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';
import { SchemaValidationError, validateWithZod } from '#shared/utils/zod';

import { AddBtStrategyFormValues } from '../containers/AddBtStrategyForm/constants';
import { AddBtStrategyData } from '../repositories/btStrategy';
import { BtStrategyRepoError } from '../repositories/btStrategy.error';

export default function useAddBtStrategy(): UseMutationResult<
  void,
  BtStrategyRepoError<'AddBtStrategyError'> | SchemaValidationError,
  AddBtStrategyFormValues
> {
  const { btStrategyRepo } = useContext(InfraContext);

  return useMutation({
    mutationFn: (data) =>
      pipe(
        parseMutationData(data),
        te.fromEither,
        te.chainW(btStrategyRepo.addBtStrategy),
        executeTeToPromise,
      ),
  });
}

function parseMutationData(
  data: AddBtStrategyFormValues,
): e.Either<SchemaValidationError, AddBtStrategyData> {
  return validateWithZod(
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
  ) as e.Either<SchemaValidationError, AddBtStrategyData>;
}
