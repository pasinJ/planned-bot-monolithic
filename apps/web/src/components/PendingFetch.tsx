import CircularProgress from '@mui/material/CircularProgress';
import * as io from 'fp-ts/lib/IO';

import { AppError } from '#shared/errors/appError';

import FetchingFailed from './FetchingFailed';

export default function PendingFetch({
  isLoading,
  error,
  retryFetch,
}: {
  isLoading: boolean;
  error: AppError | null;
  retryFetch: io.IO<void>;
}) {
  return (
    <>
      {isLoading ? <CircularProgress className="abs-center" /> : undefined}
      <FetchingFailed className="abs-center" error={error} onRetry={retryFetch} />
    </>
  );
}
