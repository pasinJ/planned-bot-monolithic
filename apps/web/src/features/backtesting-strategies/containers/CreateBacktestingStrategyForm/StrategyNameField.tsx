import TextField from '@mui/material/TextField';
import { dissoc } from 'ramda';
import { useController } from 'react-hook-form';

import type { CreateBacktestingStrategyControl } from '.';

export function StrategyNameField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'name',
    control,
    rules: { required: 'Strategy name is required' },
  });

  return (
    <TextField
      id="strategy-name"
      label="Strategy name"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      {...dissoc('ref', field)}
    />
  );
}
