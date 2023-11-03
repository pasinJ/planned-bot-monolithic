import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { isNotNil } from 'ramda';

import MaterialSymbol from '#components/MaterialSymbol';
import { ExecutionTime } from '#features/btStrategies/btExecution';
import { UseExecutionProgressResp } from '#features/btStrategies/hooks/useExecutionProgress';

export type LogsPanelProps = {
  progress: UseExecutionProgressResp | undefined;
  executionTimeMs?: ExecutionTime;
};

export default function LogsPanel({ progress, executionTimeMs }: LogsPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex w-full items-center justify-center gap-x-4">
        {progress === undefined || progress.status === 'PENDING' ? (
          <>
            <CircularProgress size="3rem" />
            <Typography>{progress?.status ?? ' '}</Typography>
          </>
        ) : progress.status === 'RUNNING' ? (
          <>
            {progress.percentage === 0 ? (
              <CircularProgress size="3rem" />
            ) : (
              <CircularProgress variant="determinate" value={progress.percentage} size="3rem" />
            )}
            <Typography>Progress: {progress.percentage}%</Typography>
          </>
        ) : progress.status === 'FINISHED' ? (
          <>
            <div className="flex items-center gap-x-4">
              <MaterialSymbol symbol="check_circle" className="text-5xl text-success" />
              <Typography>{progress.status}</Typography>
              {executionTimeMs ? <Typography>({executionTimeMs / 1000} s.)</Typography> : undefined}
            </div>
          </>
        ) : (
          <>
            <MaterialSymbol symbol="error" className="text-5xl text-error" />
            <Typography className="text-error">{progress.status}</Typography>
          </>
        )}
      </div>
      <div className="max-h-[40rem] min-h-[32rem] flex-grow space-y-1 overflow-auto whitespace-break-spaces rounded-2xl bg-gray-900 p-8 text-gray-100 scrollbar dark:bg-slate-950/50 dark:scrollbar-thin dark:scrollbar-track-gray-500/25 dark:scrollbar-thumb-gray-600">
        {progress?.logs.map((value, index) => {
          const matchString = /^(\[.*\]\s\[.*\])\s(.*)$/.exec(value);
          if (isNotNil(matchString)) {
            return (
              <div key={index} className="flex gap-x-2">
                <Typography className="font-bold">{matchString[1]}</Typography>
                <Typography className="opacity-80">{matchString[2]}</Typography>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
