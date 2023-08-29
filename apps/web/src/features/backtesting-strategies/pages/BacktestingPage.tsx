import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { isEmpty } from 'ramda';
import { MouseEventHandler, useState } from 'react';

import FetchingFailed from '#components/FetchingFailed';
import useBacktestingStrategies from '#features/backtesting-strategies/hooks/useBacktestingStrategies';
import { BacktestingCreatePageLink } from '#routes/components/pageLinks';

export default function BacktestingPage() {
  const [autoFetching, setAutoFetching] = useState(true);
  const backtestingStrategies = useBacktestingStrategies(autoFetching);

  if (backtestingStrategies.isError && autoFetching) setAutoFetching(false);
  const handleRetry: MouseEventHandler<HTMLButtonElement> = () => setAutoFetching(true);

  return (
    <Box>
      <Typography variant="h1">Backtesting page</Typography>
      {backtestingStrategies.isLoading ? (
        <Spinner />
      ) : backtestingStrategies.isError ? (
        <FetchingFailed isFetchingFailed={backtestingStrategies.isError} onRetry={handleRetry} />
      ) : isEmpty(backtestingStrategies.data) ? (
        <>
          <Typography>You have no existing strategy.</Typography>
          <Button variant="contained" color="primary" component={BacktestingCreatePageLink}>
            Create
          </Button>
        </>
      ) : null}
    </Box>
  );
}

function Spinner() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <CircularProgress size="4rem" />
    </div>
  );
}
