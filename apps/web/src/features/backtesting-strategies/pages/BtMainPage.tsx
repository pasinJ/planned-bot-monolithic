import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { isEmpty } from 'ramda';
import { MouseEventHandler, useState } from 'react';

import FetchingFailed from '#components/FetchingFailed';
import useBtStrategies from '#features/backtesting-strategies/hooks/useBtStrategies';
import { AddBtStrategyPageLink } from '#routes/components/pageLinks';

export default function BtMainPage() {
  const [autoFetching, setAutoFetching] = useState(true);
  const btStrategies = useBtStrategies(autoFetching);

  if (btStrategies.isError && autoFetching) setAutoFetching(false);
  const handleRetry: MouseEventHandler<HTMLButtonElement> = () => setAutoFetching(true);

  return (
    <Box>
      <Typography variant="h1">Backtesting page</Typography>
      {btStrategies.isLoading ? (
        <Spinner />
      ) : btStrategies.isError ? (
        <FetchingFailed isFetchingFailed={btStrategies.isError} onRetry={handleRetry} />
      ) : isEmpty(btStrategies.data) ? (
        <>
          <Typography>You have no existing strategy.</Typography>
          <Button variant="contained" color="primary" component={AddBtStrategyPageLink}>
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
