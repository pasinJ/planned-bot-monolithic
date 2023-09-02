import { useController } from 'react-hook-form';

import { DecimalField } from '#components/DecimalField';

import type { AddBtStrategyControl } from '.';

export function MakerFeeRateField({ control }: { control: AddBtStrategyControl }) {
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
      className="min-w-[8rem] flex-grow"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      InputProps={{ endAdornment: '%' }}
      {...{ name, value, onChange, onBlur: onChange }}
    />
  );
}
