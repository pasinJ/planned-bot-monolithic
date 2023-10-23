import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import * as io from 'fp-ts/lib/IO';
import * as t from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/function';
import { MouseEventHandler } from 'react';
import { UseFormProps, useForm } from 'react-hook-form';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange';
import { ValidDate } from '#shared/utils/date';
import { executeT, ioVoid } from '#shared/utils/fp';
import { IntegerString } from '#shared/utils/string';

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
};
const formOptions: UseFormProps<BacktestForm> = { defaultValues: defaultFormValues, mode: 'all' };

type BacktestStrategyFormProps = {
  activeStep: number;
  moveToPrevStep: io.IO<void>;
  moveToNextStep: io.IO<void>;
};
export default function BacktestStrategyForm(props: BacktestStrategyFormProps) {
  const { activeStep, moveToPrevStep, moveToNextStep } = props;

  const { control, trigger } = useForm<BacktestForm>(formOptions);

  const handleMoveNextStep: MouseEventHandler<HTMLButtonElement> = () => {
    void pipe(
      trigger,
      t.chainIOK((isFormValid) => (isFormValid ? moveToNextStep : ioVoid)),
      executeT,
    );
  };

  return (
    <div className="w-fit rounded-xl bg-background p-4 shadow-2 lg:mt-6 lg:p-10">
      <form aria-label="backtest strategy">
        {activeStep === 0 ? (
          <GeneralDetailsStep control={control} />
        ) : activeStep === 1 ? (
          <StrategyDetailsStep />
        ) : activeStep === 2 ? (
          <BacktestingResultStep />
        ) : undefined}
      </form>
      <Divider className="my-4" />
      <div className="flex justify-between pt-2">
        <Button className={activeStep === 0 ? 'invisible' : ''} variant="outlined" onClick={moveToPrevStep}>
          Back
        </Button>
        <Button variant="contained" onClick={handleMoveNextStep}>
          {activeStep === 0 ? 'Next' : activeStep === 1 ? 'Save & Execute' : 'Done'}
        </Button>
      </div>
    </div>
  );
}
