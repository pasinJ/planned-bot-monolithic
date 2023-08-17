import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { isEmpty, isNil } from 'ramda';
import { MouseEventHandler, useState } from 'react';

import MaterialSymbol from '#components/MaterialSymbol';
import CreatePortfolioModal from '#features/portfolios/containers/CreatePortfolioModal';
import usePortfolios from '#features/portfolios/hooks/usePortfolios';

export default function DashboardPage() {
  const [autoFetching, setAutoFetching] = useState(true);
  const portfolios = usePortfolios(autoFetching);

  if (portfolios.isError && autoFetching) setAutoFetching(false);
  const handleClick: MouseEventHandler<HTMLButtonElement> = () => setAutoFetching(true);

  return (
    <div className="h-full w-full">
      {portfolios.isLoading ? (
        <Spinner />
      ) : portfolios.isError || isNil(portfolios.data) ? (
        <FetchingDataFailed onClick={handleClick} />
      ) : isEmpty(portfolios.data) ? (
        <RequirePortfolioMsg />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <CircularProgress size="4rem" />
    </div>
  );
}

function RequirePortfolioMsg() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-4">
      <Typography variant="h6" component="p" className="text-center">
        You do not have a portfolio. Please create one to continue.
      </Typography>
      <CreatePortfolioModal />
    </div>
  );
}

function FetchingDataFailed({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-4">
      <MaterialSymbol symbol="error" className="text-5xl text-error" />
      <Typography variant="h6" component="p" className="text-center">
        Failed to fetch data from server. Please try again.
      </Typography>
      <Button
        variant="contained"
        aria-label="retry fetching data"
        startIcon={<MaterialSymbol symbol="replay" />}
        onClick={onClick}
      >
        Retry
      </Button>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="h-full w-full">
      <Typography variant="h1">Dashboard</Typography>
    </div>
  );
}
