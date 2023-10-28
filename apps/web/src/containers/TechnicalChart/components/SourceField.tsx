import MenuItem from '@mui/material/MenuItem';
import { Control, Path } from 'react-hook-form';

import SelectFieldRf from '#components/SelectFieldRf';

import { Source, sourcesList } from '../utils';

export default function SourceField<T extends { source: Source }>({ control }: { control: Control<T> }) {
  return (
    <SelectFieldRf
      controllerProps={{
        control,
        name: 'source' as Path<T>,
        rules: { required: 'Indicator source is required' },
      }}
      formControlProps={{ className: 'min-w-[10rem] flex-grow' }}
      selectProps={{ id: 'indicator-source', label: 'Source', labelId: 'source-label', required: true }}
    >
      {sourcesList.map((source, index) => (
        <MenuItem key={index} value={source}>
          {source}
        </MenuItem>
      ))}
    </SelectFieldRf>
  );
}
