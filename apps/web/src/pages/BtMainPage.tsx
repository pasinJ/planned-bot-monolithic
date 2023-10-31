import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { isEmpty } from 'ramda';

import MaterialSymbol from '#components/MaterialSymbol';
import PendingFetch from '#components/PendingFetch';
import useBtStrategies from '#features/btStrategies/hooks/useBtStrategies';
import useAutoFetch from '#hooks/useAutoFetch';
import { BackStrategyPageLink } from '#routes/components/pageLinks';

export default function BtMainPage() {
  const [fetchBtStrategies, handleRetryFetchBtStrategies] = useAutoFetch(true, useBtStrategies);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between">
        <Typography className="font-bold" variant="h2" component="h1">
          Backtesting
        </Typography>
        <Button
          className="h-fit py-3"
          variant="contained"
          color="primary"
          size="large"
          component={BackStrategyPageLink()}
          endIcon={<MaterialSymbol symbol="add" />}
        >
          Create
        </Button>
      </header>
      <div className="relative flex-grow">
        <PendingFetch
          isLoading={fetchBtStrategies.isLoading}
          error={fetchBtStrategies.error}
          retryFetch={handleRetryFetchBtStrategies}
        />
        <div>
          {isEmpty(fetchBtStrategies.data) ? (
            <Typography>You have no existing strategy.</Typography>
          ) : undefined}
        </div>
      </div>
    </div>
  );
}
