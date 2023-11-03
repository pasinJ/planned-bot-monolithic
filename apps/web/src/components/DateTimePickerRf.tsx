import { TextFieldProps } from '@mui/material';
import { DateTimePicker, DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { FieldPathValue, FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

type DateTimePickerRfProps<TDate, T extends FieldValues, N extends Path<T>> = {
  controllerProps: UseControllerProps<T, N>;
  dateTimePickerProps: DateTimePickerProps<TDate>;
  textFieldProps: TextFieldProps;
};

export default function DateTimePickerRf<TDate, T extends FieldValues, N extends Path<T>>(
  props: FieldPathValue<T, N> extends Date
    ? DateTimePickerRfProps<TDate, T, N>
    : DateTimePickerRfProps<TDate, T, N> & { __fieldMustBeDate: never },
) {
  const { controllerProps, dateTimePickerProps, textFieldProps } = props;
  const {
    field: { name, onChange, onBlur, value, ref },
    fieldState: { invalid, error },
  } = useController(controllerProps);

  return (
    <DateTimePicker
      slotProps={{
        textField: {
          name,
          value,
          onChange,
          onBlur,
          inputRef: ref,
          error: invalid,
          helperText: error?.message ?? ' ',
          ...textFieldProps,
        },
      }}
      inputRef={ref}
      value={value}
      onChange={onChange}
      {...dateTimePickerProps}
    />
  );
}
