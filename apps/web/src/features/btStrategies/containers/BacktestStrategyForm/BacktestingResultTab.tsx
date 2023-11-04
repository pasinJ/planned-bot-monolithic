import { Divider } from '@mui/material';
import Button from '@mui/material/Button';

import { BtExecutionId } from '#features/btStrategies/btExecution';
import { AssetCurrency, BtRange, CapitalCurrency, InitialCapital } from '#features/btStrategies/btStrategy';
import { Kline } from '#features/klines/kline';
import { BacktestMainPageLink } from '#routes/components/pageLinks';

import BtExecutionReport from '../BtExecutionReport';

type BacktestingResultTabProps = {
  btExecutionId: BtExecutionId;
  klines: readonly Kline[];
  initialCapital: InitialCapital;
  capitalCurrency: CapitalCurrency;
  assetCurrency: AssetCurrency;
  btRange: BtRange;
  moveToPrevTab: () => void;
};
export default function BacktestingResultTab(props: BacktestingResultTabProps) {
  const { moveToPrevTab, ...restProps } = props;

  return (
    <div className="flex w-full flex-col rounded-xl bg-background shadow-2 lg:mt-6">
      <BtExecutionReport {...restProps} />
      <Divider variant="middle" />
      <div className="flex justify-between px-6 py-4">
        <Button variant="outlined" onClick={moveToPrevTab}>
          Back
        </Button>
        <Button variant="contained" component={BacktestMainPageLink}>
          Done
        </Button>
      </div>
    </div>
  );
}
