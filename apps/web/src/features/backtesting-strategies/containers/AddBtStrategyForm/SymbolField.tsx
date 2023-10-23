import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { omit, prop } from 'ramda';
import { useController } from 'react-hook-form';

import { Symbol } from '#features/symbols/domain/symbol';

import type { AddBtStrategyControl } from '.';

export default function SymbolField({
  control,
  symbols,
}: {
  control: AddBtStrategyControl;
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
      className="min-w-[10rem] flex-grow"
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
