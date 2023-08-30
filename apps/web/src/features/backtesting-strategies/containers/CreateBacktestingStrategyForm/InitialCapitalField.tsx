import { useController, useWatch } from 'react-hook-form';

import { DecimalField } from '#components/DecimalField';

import type { CreateBacktestingStrategyControl } from '.';

export function InitialCapitalField({ control }: { control: CreateBacktestingStrategyControl }) {
  const currency = useWatch({ name: 'currency', control });
  const { field, fieldState } = useController({
    name: 'initialCapital',
    control,
    rules: {
      required: 'Initial capital is required',
    },
  });
  const { name, onChange, value } = field;

  return (
    <DecimalField
      label="Initial capital"
      className="w-full"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      InputProps={{ endAdornment: currency }}
      {...{ name, value, onChange, onBlur: onChange }}
    />
  );
}
