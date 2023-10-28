import TextField, { TextFieldProps } from '@mui/material/TextField';
import { FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

type TextFieldRfProps<T extends FieldValues> = {
  controllerProps: UseControllerProps<T, Path<T>>;
  fieldProps: TextFieldProps;
};

export default function TextFieldRf<T extends FieldValues>(props: TextFieldRfProps<T>) {
  const { controllerProps, fieldProps } = props;
  const {
    field: { name, onChange, onBlur, value, ref },
    fieldState: { invalid, error },
  } = useController(controllerProps);

  return (
    <TextField
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      inputRef={ref}
      error={invalid}
      helperText={error?.message ?? ' '}
      {...fieldProps}
    />
  );
}
