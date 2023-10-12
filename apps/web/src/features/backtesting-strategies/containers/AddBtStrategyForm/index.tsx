import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as io from 'fp-ts/lib/IO';
import { Control, useForm } from 'react-hook-form';

import useAddBtStrategy from '#features/backtesting-strategies/hooks/useAddBtStrategy';
import useSymbols from '#features/symbols/hooks/useSymbols';

import CurrencyField from './CurrencyField';
import EndTimestampField from './EndTimestampField';
import ExchangeField from './ExchangeField';
import InitialCapitalField from './InitialCapitalField';
import MakerFeeRateField from './MakerFeeRateField';
import MaxNumKlinesField from './MaxNumKlinesField';
import StartTimestampField from './StartTimestampField';
import StrategyBodyField from './StrategyBodyField';
import StrategyNameField from './StrategyNameField';
import SymbolField from './SymbolField';
import TakerFeeRateField from './TakerFeeRateField';
import TimeframeField from './TimeframeField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

export type AddBtStrategyControl = Control<AddBtStrategyFormValues>;
export default function AddBtStrategyForm() {
  const { control, handleSubmit } = useForm({ defaultValues, mode: 'all' });
  const addBtStrategy = useAddBtStrategy();
  const symbols = useSymbols(true);

  const onSubmit = handleSubmit((data) => addBtStrategy.mutate(data)) as io.IO<void>;

  return (
    <form
      aria-label="add backtesting strategy"
      className="mt-1 flex w-full max-w-4xl flex-col gap-y-2 self-center rounded-xl bg-background p-4 shadow-2 lg:mt-4 lg:p-10"
      onSubmit={onSubmit}
    >
      <StrategyNameField control={control} />
      <Divider textAlign="center" className="mb-2">
        Symbol information
      </Divider>
      <Box>
        <Box className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
          <ExchangeField control={control} />
          <SymbolField control={control} symbols={symbols.data} />
          <CurrencyField control={control} symbols={symbols.data} />
        </Box>
        <Box className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
          <TimeframeField control={control} />
          <MaxNumKlinesField control={control} />
        </Box>
      </Box>
      <Divider textAlign="center" className="mb-2">
        Strategy properties
      </Divider>
      <Box>
        <Box className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
          <InitialCapitalField control={control} />
          <TakerFeeRateField control={control} />
          <MakerFeeRateField control={control} />
        </Box>
        <Box className="flex flex-col">
          <Box className="mb-2 flex flex-wrap gap-6 gap-y-2">
            <Typography variant="body2" component="label" className="mb-3 min-w-max text-gray-600">
              Backtesting period
            </Typography>
            <Box className="flex min-w-[8rem] flex-grow flex-wrap gap-x-6">
              <StartTimestampField control={control} />
              <EndTimestampField control={control} />
            </Box>
          </Box>
          <StrategyBodyField control={control} />
        </Box>
      </Box>
      {addBtStrategy.isSuccess ? 'Success' : addBtStrategy.isError ? addBtStrategy.error.toString() : null}
      <Box>
        <LoadingButton
          aria-label="submit add backtesting strategy"
          variant="contained"
          color="primary"
          type="submit"
          className="mt-4 w-full py-2"
          loading={addBtStrategy.isLoading}
        >
          <Typography variant="inherit">Submit</Typography>
        </LoadingButton>
      </Box>
    </form>
  );
}
