import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Control, Path, useController } from 'react-hook-form';

import { Source, sourcesList } from '../utils';

export default function SourceField<T extends { source: Source }>({ control }: { control: Control<T> }) {
  const { field, fieldState } = useController({
    name: 'source' as Path<T>,
    control,
    rules: { required: 'Indicator source is required' },
  });
  const { ref: inputRef, ...restProps } = field;

  const labelId = 'source-label';
  const labelText = 'Source';

  return (
    <FormControl className="min-w-[10rem] flex-grow" error={fieldState.invalid}>
      <InputLabel id={labelId} required>
        {labelText}
      </InputLabel>
      <Select
        id="indicator-source"
        labelId={labelId}
        label={labelText}
        {...restProps}
        inputRef={inputRef}
        inputProps={{ 'aria-labelledby': labelId }}
        required
      >
        {sourcesList.map((source, index) => (
          <MenuItem key={index} value={source}>
            {source}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{fieldState.error?.message ?? ' '}</FormHelperText>
    </FormControl>
  );
}
