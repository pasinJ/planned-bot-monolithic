import TextField from '@mui/material/TextField';
import { Control, Path, useController } from 'react-hook-form';

export default function NameField<T extends { name: string }>({ control }: { control: Control<T> }) {
  const { field, fieldState } = useController({
    name: 'name' as Path<T>,
    control,
    rules: { required: 'Indicator name is required' },
  });
  const { ref: inputRef, ...restProps } = field;

  return (
    <TextField
      id="indicator-name"
      label="Name"
      required
      {...restProps}
      inputRef={inputRef}
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
    />
  );
}
