import TextField, { TextFieldProps } from '@mui/material/TextField';
import { FieldPathValue, FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

type TextFieldRfProps<T extends FieldValues, N extends Path<T>> = {
  controllerProps: FieldPathValue<T, N> extends string
    ? UseControllerProps<T, N>
    : UseControllerProps<T, N> & { __fieldMustExtendString: never };
  fieldProps: TextFieldProps;
};

export default function TextFieldRf<T extends FieldValues, N extends Path<T>>(props: TextFieldRfProps<T, N>) {
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
