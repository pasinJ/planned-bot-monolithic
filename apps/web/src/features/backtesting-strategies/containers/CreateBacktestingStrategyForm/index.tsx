import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as io from 'fp-ts/lib/IO';
import { Control, useForm } from 'react-hook-form';

import useCreateBacktestingStrategy from '#features/backtesting-strategies/hooks/useCreateBacktestingStrategy';
import useSymbols from '#features/symbols/hooks/useSymbols';
import { getErrorSummary } from '#utils/error';

import { CurrencyField } from './CurrencyField';
import { EndTimestampField } from './EndTimestampField';
import { ExchangeField } from './ExchangeField';
import { InitialCapitalField } from './InitialCapitalField';
import { MakerFeeRateField } from './MakerFeeRateField';
import { MaxNumKlinesField } from './MaxNumKlinesField';
import { StartTimestampField } from './StartTimestampField';
import { StrategyBodyField } from './StrategyBodyField';
import { StrategyNameField } from './StrategyNameField';
import { SymbolField } from './SymbolField';
import { TakerFeeRateField } from './TakerFeeRateField';
import { TimeframeField } from './TimeframeField';
import { FormValues, defaultValues } from './constants';

export type CreateBacktestingStrategyControl = Control<FormValues>;
export default function CreateBacktestingStrategyForm() {
  const { control, handleSubmit } = useForm({ defaultValues, mode: 'all' });
  const createBacktestingStrategy = useCreateBacktestingStrategy();
  const symbols = useSymbols(true);

  const onSubmit = handleSubmit((data) => createBacktestingStrategy.mutate(data)) as io.IO<void>;

  return (
    <form
      aria-label="create backtesting strategy"
      className="mt-4 flex w-full max-w-4xl flex-col space-y-3 self-center rounded-xl bg-background p-10 shadow-2"
      onSubmit={onSubmit}
    >
      <StrategyNameField control={control} />
      <Divider textAlign="center">Symbol information</Divider>
      <Box className="flex space-x-6">
        <ExchangeField control={control} />
        <SymbolField control={control} symbols={symbols.data} />
        <CurrencyField control={control} symbols={symbols.data} />
      </Box>
      <Box className="flex space-x-6">
        <TimeframeField control={control} />
        <MaxNumKlinesField control={control} />
      </Box>
      <Divider textAlign="center">Strategy properties</Divider>
      <Box className="flex space-x-6">
        <InitialCapitalField control={control} />
        <TakerFeeRateField control={control} />
        <MakerFeeRateField control={control} />
      </Box>
      <Box className="flex flex-col">
        <Box className="flex space-x-6">
          <Typography variant="body2" component="label" className="min-w-max text-gray-600">
            Backtesting period
          </Typography>
          <StartTimestampField control={control} />
          <EndTimestampField control={control} />
        </Box>
        <StrategyBodyField control={control} />
      </Box>
      {createBacktestingStrategy.isSuccess
        ? 'Success'
        : createBacktestingStrategy.isError
        ? getErrorSummary(createBacktestingStrategy.error)
        : null}
      <Box>
        <LoadingButton
          aria-label="submit create backtesting strategy"
          variant="contained"
          color="primary"
          type="submit"
          className="mt-4 w-full py-2"
          loading={createBacktestingStrategy.isLoading}
        >
          <Typography variant="inherit">Submit</Typography>
        </LoadingButton>
      </Box>
    </form>
  );
}
