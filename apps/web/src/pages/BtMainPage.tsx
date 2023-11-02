import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import MaterialSymbol from '#components/MaterialSymbol';
import BtStrategyTable from '#features/btStrategies/containers/BtStrategiesTable';
import { BacktestStrategyPageLink } from '#routes/components/pageLinks';

export default function BtMainPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between">
        <Typography className="font-bold" variant="h2" component="h1">
          Backtesting
        </Typography>
        <Button
          className="h-fit rounded-2xl py-3"
          variant="contained"
          color="primary"
          size="large"
          component={BacktestStrategyPageLink()}
          endIcon={<MaterialSymbol symbol="add" />}
        >
          Create
        </Button>
      </header>
      <div className="relative flex-grow py-6">
        <BtStrategyTable />
      </div>
    </div>
  );
}
