import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { dissoc } from 'ramda';
import { useController } from 'react-hook-form';

import { exchangeEnum } from '#features/shared/domain/exchange';

import type { CreateBacktestingStrategyControl } from '.';

const labelId = 'exchange-label';
const labelText = 'Exchange';

export function ExchangeField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field } = useController({ name: 'exchange', control });

  return (
    <FormControl className="w-full" disabled>
      <InputLabel id={labelId}>{labelText}</InputLabel>
      <Select
        id="exchange"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId, 'aria-disabled': true }}
        {...dissoc('ref', field)}
      >
        <MenuItem value={exchangeEnum.BINANCE} selected>
          Binance
        </MenuItem>
      </Select>
    </FormControl>
  );
}
