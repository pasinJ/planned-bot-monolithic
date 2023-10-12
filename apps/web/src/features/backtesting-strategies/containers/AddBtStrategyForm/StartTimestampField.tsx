import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { dissoc } from 'ramda';
import { useController } from 'react-hook-form';

import type { AddBtStrategyControl } from '.';

export default function StartTimestampField({ control }: { control: AddBtStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'startTimestamp',
    control,
    rules: { required: 'Start timestamp is required' },
  });

  return (
    <DateTimePicker
      label="Start timestamp"
      className="min-w-[8rem] flex-grow"
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
