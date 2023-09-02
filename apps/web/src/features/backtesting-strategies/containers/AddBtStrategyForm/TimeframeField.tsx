import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { dissoc, toPairs } from 'ramda';
import { useController } from 'react-hook-form';

import type { AddBtStrategyControl } from '.';
import { timeframeOptions } from './constants';

const labelId = 'timeframe-label';
const labelText = 'Timeframe';

export function TimeframeField({ control }: { control: AddBtStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'timeframe',
    control,
    rules: { required: 'Timeframe is required' },
  });

  return (
    <FormControl className="min-w-[10rem] flex-grow" error={fieldState.invalid}>
      <InputLabel id={labelId} required>
        {labelText}
      </InputLabel>
      <Select
        id="timeframe"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId }}
        required
        {...dissoc('ref', field)}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {toPairs(timeframeOptions).map(([value, label], index) => (
          <MenuItem key={index} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{fieldState.error?.message ?? ' '}</FormHelperText>
    </FormControl>
  );
}
