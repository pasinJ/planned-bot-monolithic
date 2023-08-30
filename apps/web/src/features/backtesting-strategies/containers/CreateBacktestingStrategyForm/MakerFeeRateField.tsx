import { useController } from 'react-hook-form';

import { DecimalField } from '#components/DecimalField';

import type { CreateBacktestingStrategyControl } from '.';

export function MakerFeeRateField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'makerFeeRate',
    control,
    rules: {
      max: { value: 100, message: 'Fee rate must be between 0 and 100' },
      required: 'Maker fee rate is required',
    },
  });
  const { name, onChange, value } = field;

  return (
    <DecimalField
      label="Maker fee rate"
      className="w-full"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      InputProps={{ endAdornment: '%' }}
      {...{ name, value, onChange, onBlur: onChange }}
    />
  );
}
