import { useController } from 'react-hook-form';

import DecimalField from '#components/DecimalField';

import type { AddBtStrategyControl } from '.';

export default function TakerFeeRateField({ control }: { control: AddBtStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'takerFeeRate',
    control,
    rules: {
      max: { value: 100, message: 'Fee rate must be between 0 and 100' },
      required: 'Taker fee rate is required',
    },
  });
  const { name, onChange, value } = field;

  return (
    <DecimalField
      label="Taker fee rate"
      className="min-w-[8rem] flex-grow"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      InputProps={{ endAdornment: '%' }}
      {...{ name, value, onChange, onBlur: onChange }}
    />
  );
}
