import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { isEmpty, isNil } from 'ramda';
import { MouseEventHandler, useState } from 'react';

import CreatePortfolioModal from '#features/portfolios/containers/CreatePortfolioModal';
import usePortfolios from '#features/portfolios/hooks/usePortfolios';

export default function DashboardPage() {
  const [autoFetching, setAutoFetching] = useState(true);
  const portfolios = usePortfolios(autoFetching);

  if (portfolios.isError && autoFetching) setAutoFetching(false);
  const handleClick: MouseEventHandler<HTMLButtonElement> = () => setAutoFetching(true);

  if (portfolios.isLoading) return <CircularProgress />;
  else if (portfolios.isError || isNil(portfolios.data)) return <FetchingDataFailed onClick={handleClick} />;
  else if (isEmpty(portfolios.data)) return <RequirePortfolioMsg />;
  else return <Typography variant="h1">Dashboard</Typography>;
}

function RequirePortfolioMsg() {
  return (
    <>
      <Typography variant="body1">You do not have a portfolio. Please create one to continue.</Typography>
      <CreatePortfolioModal />
    </>
  );
}

function FetchingDataFailed({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <>
      <Typography variant="body1">Failed to fetch data from server. Please try again.</Typography>
      <Button variant="contained" color="primary" aria-label="retry fetching data" onClick={onClick}>
        Retry
      </Button>
    </>
  );
}
