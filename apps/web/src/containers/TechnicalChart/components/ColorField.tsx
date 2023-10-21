import Typography from '@mui/material/Typography';
import { Control, Path, useController } from 'react-hook-form';

import ColorPickerButton from './ColorPickerButton';

export default function ColorField<T extends Record<N, string>, N extends string>(props: {
  name: N;
  label: string;
  labelId: string;
  control: Control<T>;
}) {
  const { name, label, labelId, control } = props;
  const { field } = useController({ name: name as unknown as Path<T>, control });

  return (
    <div className="flex items-center justify-between">
      <Typography id={labelId} variant="body2" className="mr-4">
        {label}
      </Typography>
      <ColorPickerButton aria-labelledby={labelId} value={field.value as string} onChange={field.onChange} />
    </div>
  );
}
