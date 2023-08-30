import { useController } from 'react-hook-form';

import { IntegerField } from '#components/IntegerField';

import type { CreateBacktestingStrategyControl } from '.';

export function MaxNumKlinesField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'maxNumKlines',
    control,
    rules: {
      required: 'This field is required',
      min: { value: 1, message: 'This field must be greater than 0' },
    },
  });
  const { name, onChange, value } = field;

  return (
    <IntegerField
      label="Maximum number of candlesticks per execution"
      className="w-full min-w-[320px]"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      {...{ name, value, onChange, onBlur: onChange }}
    />
  );
}
