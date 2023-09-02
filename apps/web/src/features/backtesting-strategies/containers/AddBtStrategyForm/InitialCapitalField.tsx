import { useController, useWatch } from 'react-hook-form';

import { DecimalField } from '#components/DecimalField';

import type { AddBtStrategyControl } from '.';

export function InitialCapitalField({ control }: { control: AddBtStrategyControl }) {
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
      className="min-w-[8rem] flex-grow"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      InputProps={{ endAdornment: currency }}
      {...{ name, value, onChange, onBlur: onChange }}
    />
  );
}
