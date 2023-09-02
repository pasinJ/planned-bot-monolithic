import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { MouseEventHandler } from 'react';

import MaterialSymbol from './MaterialSymbol';

export default function FetchingFailed({
  isFetchingFailed,
  onRetry,
}: {
  isFetchingFailed: boolean;
  onRetry: MouseEventHandler;
}) {
  return isFetchingFailed ? (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-4">
      <MaterialSymbol symbol="error" className="text-5xl text-error" />
      <Typography variant="h6" component="p" className="text-center">
        Failed to fetch data from server. Please try again.
      </Typography>
      <Button
        variant="contained"
        aria-label="retry fetching data"
        startIcon={<MaterialSymbol symbol="replay" />}
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  ) : null;
}
