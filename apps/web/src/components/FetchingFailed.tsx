import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { MouseEventHandler } from 'react';

import { AppError } from '#shared/errors/appError';
import { mergeClassName } from '#shared/utils/tailwind';

import MaterialSymbol from './MaterialSymbol';

type FetchingFailedProps = { className?: string; error: AppError | null; onRetry: MouseEventHandler };
export default function FetchingFailed(props: FetchingFailedProps) {
  const { className, onRetry, error } = props;

  return error === null ? undefined : (
    <div
      className={mergeClassName(
        'flex h-full w-full flex-col items-center justify-center gap-6 px-4',
        className,
      )}
    >
      <MaterialSymbol symbol="error" className="text-5xl text-error" />
      <Typography variant="h6" component="p" className="text-center">
        Failed to fetch data from server. Please try again.
      </Typography>
      <Typography variant="body1" component="p" className="text-center">
        {`[${error.name}]: ${error.message}`}
      </Typography>
      <Button
        variant="outlined"
        aria-label="retry fetching data"
        startIcon={<MaterialSymbol symbol="replay" />}
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
}
