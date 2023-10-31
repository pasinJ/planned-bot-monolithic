import FormControl, { FormControlProps } from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectProps } from '@mui/material/Select';
import { PropsWithChildren } from 'react';
import { FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

type SelectFieldRf<T extends FieldValues, N extends Path<T>> = PropsWithChildren<{
  controllerProps: UseControllerProps<T, N>;
  formControlProps: FormControlProps;
  selectProps: SelectProps;
}>;

export default function SelectFieldRf<T extends FieldValues, N extends Path<T>>(props: SelectFieldRf<T, N>) {
  const { controllerProps, formControlProps, selectProps, children } = props;

  const {
    field: { name, onChange, onBlur, value, ref },
    fieldState: { invalid, error },
  } = useController(controllerProps);

  return (
    <FormControl {...formControlProps} disabled={selectProps.disabled} error={invalid}>
      <InputLabel id={selectProps.labelId}>{selectProps.label}</InputLabel>
      <Select
        {...selectProps}
        inputProps={{ 'aria-labelledby': selectProps.labelId, 'aria-disabled': selectProps.disabled }}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        inputRef={ref}
      >
        {children}
      </Select>
      <FormHelperText>{invalid ? error?.message : ' '}</FormHelperText>
    </FormControl>
  );
}
