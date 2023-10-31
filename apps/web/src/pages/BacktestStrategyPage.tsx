import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import BacktestStrategyForm from '#features/btStrategies/containers/BacktestStrategyForm';

export default function BacktestStrategyPage() {
  return (
    <div className="flex h-full flex-col">
      <header>
        <Typography variant="h4" component="h1" className="font-medium">
          Backtest Strategy
        </Typography>
      </header>
      <Divider className="my-4" />
      <div className="flex-grow">
        <BacktestStrategyForm />
      </div>
    </div>
  );
}
