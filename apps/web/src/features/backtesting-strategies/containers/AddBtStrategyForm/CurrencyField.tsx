import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { dissoc, propEq, props } from 'ramda';
import { useController, useWatch } from 'react-hook-form';

import { Symbol } from '#features/symbols/domain/symbol.valueObject';

import type { AddBtStrategyControl } from '.';

export default function CurrencyField({
  control,
  symbols,
}: {
  control: AddBtStrategyControl;
  symbols: readonly Symbol[] | undefined;
}) {
  const { field, fieldState } = useController({
    name: 'currency',
    control,
    rules: { required: 'Base currency is required' },
  });
  const selectedSymbolValue = useWatch({ name: 'symbol', control });

  const labelText = 'Base currency';
  const labelId = 'currency-label';
  const selectedSymbol = symbols?.find(propEq(selectedSymbolValue, 'name'));

  return (
    <FormControl className="min-w-[10rem] flex-grow" error={fieldState.invalid}>
      <InputLabel id={labelId} required>
        {labelText}
      </InputLabel>
      <Select
        id="currency"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId }}
        required
        {...dissoc('ref', field)}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {selectedSymbol
          ? props(['baseAsset', 'quoteAsset'], selectedSymbol).map((value, index) => (
              <MenuItem key={index} value={value}>
                {value}
              </MenuItem>
            ))
          : null}
      </Select>
      <FormHelperText>{fieldState.error?.message ?? ' '}</FormHelperText>
    </FormControl>
  );
}
