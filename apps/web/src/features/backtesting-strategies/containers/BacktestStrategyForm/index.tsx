import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import * as io from 'fp-ts/lib/IO';
import * as t from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/function';
import { isEmpty, propEq } from 'ramda';
import { useEffect, useState } from 'react';
import { UseFormProps, useForm, useWatch } from 'react-hook-form';

import FetchingFailed from '#components/FetchingFailed';
import { StrategyBody } from '#features/backtesting-strategies/domain/btStrategy.entity';
import { exchangeNameEnum } from '#features/exchanges/domain/exchange';
import useSymbols from '#features/symbols/hooks/useSymbols';
import { ValidDate } from '#shared/utils/date';
import { executeT, ioVoid } from '#shared/utils/fp';
import { DecimalString, IntegerString } from '#shared/utils/string';

import BacktestingResultStep from './containers/BacktestingResultStep';
import GeneralDetailsStep from './containers/GeneralDetailsStep';
import StrategyDetailsStep from './containers/StrategyDetailsStep';
import { BacktestForm } from './types';

const defaultFormValues: BacktestForm = {
  name: '',
  exchange: exchangeNameEnum.BINANCE,
  symbol: null,
  timeframe: '1d',
  maxNumKlines: '100' as IntegerString,
  startTimestamp: new Date() as ValidDate,
  endTimestamp: new Date() as ValidDate,
  capitalCurrency: null,
  initialCapital: '1000' as DecimalString,
  takerFeeRate: '0' as DecimalString,
  makerFeeRate: '0' as DecimalString,
  language: 'typescript',
  body: 'console.log("Hello world!");' as StrategyBody,
};
const formOptions: UseFormProps<BacktestForm> = { defaultValues: defaultFormValues, mode: 'all' };

type BacktestStrategyFormProps = {
  activeStep: number;
  moveToPrevStep: io.IO<void>;
  moveToNextStep: io.IO<void>;
};
export default function BacktestStrategyForm(props: BacktestStrategyFormProps) {
  const { activeStep, moveToPrevStep, moveToNextStep } = props;

  const [autoFetchingSymbols, setAutoFetchingSymbols] = useState(true);
  const querySymbolsResult = useSymbols(autoFetchingSymbols);
  const handleRetryFetchSymbols = () => setAutoFetchingSymbols(true);
  if (querySymbolsResult.isError && autoFetchingSymbols) setAutoFetchingSymbols(false);

  const { control, trigger, getValues, setValue, formState, clearErrors } =
    useForm<BacktestForm>(formOptions);
  const formValues = getValues();
  const symbol = useWatch({ name: 'symbol', control });
  const selectedSymbol = querySymbolsResult.data?.find(propEq(symbol, 'name'));
  if (selectedSymbol !== undefined) setValue('capitalCurrency', selectedSymbol.quoteAsset);

  useEffect(() => clearErrors(), [activeStep, clearErrors]);

  const handleMoveNextStep = () => {
    if (isEmpty(formState.errors)) {
      void pipe(
        trigger,
        t.chainIOK((isFormValid) => (isFormValid ? moveToNextStep : ioVoid)),
        executeT,
      );
    }
  };

  return (
    <form className="relative flex w-full justify-center" aria-label="backtest strategy">
      {querySymbolsResult.isInitialLoading ? <CircularProgress className="abs-center" /> : undefined}
      <FetchingFailed
        className="abs-center"
        error={querySymbolsResult.error}
        onRetry={handleRetryFetchSymbols}
      />
      {activeStep === 0 ? (
        <GeneralDetailsStep control={control} querySymbolsResult={querySymbolsResult}>
          <Divider className="my-4" />
          <Button className="mt-2 self-end" variant="contained" onClick={handleMoveNextStep}>
            Next
          </Button>
        </GeneralDetailsStep>
      ) : activeStep === 1 && selectedSymbol !== undefined && formValues.symbol !== null ? (
        <StrategyDetailsStep control={control} formValues={formValues} selectedSymbol={selectedSymbol}>
          <Divider className="my-4" />
          <div className="mt-2 flex justify-between">
            <Button variant="outlined" onClick={moveToPrevStep}>
              Back
            </Button>
            <Button variant="contained" onClick={handleMoveNextStep}>
              Save & Execute
            </Button>
          </div>
        </StrategyDetailsStep>
      ) : activeStep === 2 ? (
        <BacktestingResultStep />
      ) : undefined}
    </form>
  );
}
