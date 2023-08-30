import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { omit, prop } from 'ramda';
import { useController } from 'react-hook-form';

import { Symbol } from '#features/symbols/domain/symbol.valueObject';

import type { CreateBacktestingStrategyControl } from '.';

export function SymbolField({
  control,
  symbols,
}: {
  control: CreateBacktestingStrategyControl;
  symbols: readonly Symbol[] | undefined;
}) {
  const { field, fieldState } = useController({
    name: 'symbol',
    control,
    rules: { required: 'Symbol is required' },
  });

  const symbolOptions = symbols?.map(prop('name')) ?? [];

  return (
    <Autocomplete
      id="symbol"
      data-testid="symbol-input"
      className="w-full"
      options={symbolOptions}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Symbol"
          variant="outlined"
          required
          error={fieldState.invalid}
          helperText={fieldState.error?.message ?? ' '}
        />
      )}
      autoComplete
      includeInputInList
      {...omit(['ref'], field)}
      onChange={(_, data) => field.onChange(data)}
    />
  );
}
