import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { dissoc } from 'ramda';
import { useController } from 'react-hook-form';

import type { AddBtStrategyControl } from '.';
import { languageOptions } from './constants';

export default function StrategyLanguageField({ control }: { control: AddBtStrategyControl }) {
  const { field } = useController({ name: 'language', control });

  const labelId = 'language';
  const labelText = 'Language';
  return (
    <FormControl className="mb-2 min-w-[12rem] flex-grow sm:max-w-[16rem]">
      <InputLabel id={labelId} required>
        {labelText}
      </InputLabel>
      <Select
        id="language"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId }}
        required
        {...dissoc('ref', field)}
      >
        {languageOptions.map((value, index) => (
          <MenuItem key={index} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
