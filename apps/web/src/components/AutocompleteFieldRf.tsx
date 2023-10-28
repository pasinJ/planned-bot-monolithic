import Autocomplete, { AutocompleteProps } from '@mui/material/Autocomplete';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { PropsWithChildren } from 'react';
import { FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

type AutocompleteFieldRf<
  T extends FieldValues,
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
> = PropsWithChildren<{
  controllerProps: UseControllerProps<T, Path<T>>;
  autocompleteProps: Omit<AutocompleteProps<Value, Multiple, DisableClearable, FreeSolo>, 'renderInput'>;
  fieldProps: TextFieldProps;
}>;

export default function AutocompleteFieldRf<
  T extends FieldValues,
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
>(props: AutocompleteFieldRf<T, Value, Multiple, DisableClearable, FreeSolo>) {
  const { controllerProps, autocompleteProps, fieldProps } = props;

  const {
    field: { name, onChange, onBlur, value, ref },
    fieldState: { invalid, error },
  } = useController(controllerProps);

  return (
    <Autocomplete
      value={value}
      onChange={(_, data) => onChange(data)}
      onBlur={onBlur}
      {...autocompleteProps}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          value={value}
          inputRef={ref}
          error={invalid}
          helperText={error?.message ?? ' '}
          {...fieldProps}
        />
      )}
    />
  );
}
