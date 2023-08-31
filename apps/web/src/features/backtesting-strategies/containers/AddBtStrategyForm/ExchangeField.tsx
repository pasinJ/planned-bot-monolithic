import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { dissoc } from 'ramda';
import { useController } from 'react-hook-form';

import { exchangeNameEnum } from '#features/shared/domain/exchange';

import type { AddBtStrategyControl } from '.';

const labelId = 'exchange-label';
const labelText = 'Exchange';

export function ExchangeField({ control }: { control: AddBtStrategyControl }) {
  const { field } = useController({ name: 'exchange', control });

  return (
    <FormControl className="min-w-[8rem] flex-grow" disabled>
      <InputLabel id={labelId}>{labelText}</InputLabel>
      <Select
        id="exchange"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId, 'aria-disabled': true }}
        {...dissoc('ref', field)}
      >
        <MenuItem value={exchangeNameEnum.BINANCE} selected>
          Binance
        </MenuItem>
      </Select>
      <FormHelperText> </FormHelperText>
    </FormControl>
  );
}
