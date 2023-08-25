import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';
import { z } from 'zod';

import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#utils/fp';
import { SchemaValidationError, parseWithZod } from '#utils/zod';

import { Portfolio } from '../domain/portfolio.entity';
import { createPortfolio } from '../repositories/portfolioRepository';
import { CreatePortfolioError } from '../repositories/portfolioRepository.type';

const parseStringFieldsToDecimal = parseWithZod(
  z.object({ initialCapital: z.coerce.number(), takerFee: z.coerce.number(), makerFee: z.coerce.number() }),
  'Parsing form values from string to decimal failed',
);

export default function useCreatePortfolio({
  onSuccess,
}: {
  onSuccess?: () => void;
}): UseMutationResult<
  Portfolio,
  CreatePortfolioError | SchemaValidationError,
  { initialCapital: string; takerFee: string; makerFee: string }
> {
  const { httpClient } = useContext(InfraContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      executeTeToPromise(
        pipe(
          parseStringFieldsToDecimal(data),
          te.fromEither,
          te.chainW((parsedData) => createPortfolio(parsedData, { httpClient })),
        ),
      ),
    onSuccess: () => {
      if (onSuccess) onSuccess();
      return queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}
