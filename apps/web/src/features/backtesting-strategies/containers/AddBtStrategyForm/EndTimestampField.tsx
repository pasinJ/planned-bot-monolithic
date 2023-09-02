import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { isBefore } from 'date-fns';
import { dissoc } from 'ramda';
import { useController } from 'react-hook-form';

import type { AddBtStrategyControl } from '.';

export function EndTimestampField({ control }: { control: AddBtStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'endTimestamp',
    control,
    rules: {
      required: 'End timestamp is required',
      validate: (value, form) =>
        isBefore(value, form.startTimestamp) ? 'End timestamp must be after start timestamp' : undefined,
    },
  });

  return (
    <DateTimePicker
      label="End timestamp"
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