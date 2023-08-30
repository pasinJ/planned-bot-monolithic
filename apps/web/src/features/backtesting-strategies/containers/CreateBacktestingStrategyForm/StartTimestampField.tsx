import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { dissoc } from 'ramda';
import { useController } from 'react-hook-form';

import type { CreateBacktestingStrategyControl } from '.';

export function StartTimestampField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'startTimestamp',
    control,
    rules: { required: 'Start timestamp is required' },
  });

  return (
    <DateTimePicker
      label="Start timestamp"
      className="w-full"
      ampm={false}
      disableFuture
      slotProps={{
        textField: {
          error: fieldState.invalid,
          helperText: fieldState.error?.message ?? ' ',
          required: true,
        },
      }}
      {...dissoc('ref', field)}
    />
  );
}
