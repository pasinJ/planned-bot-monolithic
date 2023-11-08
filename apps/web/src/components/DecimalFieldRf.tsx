import { flow } from 'fp-ts/lib/function';
import { FieldPathValue, FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

import { DecimalString } from '#shared/utils/string';

import DecimalField, { DecimalFieldProps } from './DecimalField';

type DecimalFieldRfProps<T extends FieldValues, N extends Path<T>> = {
  controllerProps: FieldPathValue<T, N> extends DecimalString ? UseControllerProps<T, N> : never;
  fieldProps: Omit<DecimalFieldProps, 'value'>;
};

export default function DecimalFieldRf<T extends FieldValues, N extends Path<T>>(
  props: FieldPathValue<T, N> extends DecimalString
    ? DecimalFieldRfProps<T, N>
    : DecimalFieldRfProps<T, N> & { __fieldMustBeDecimalString: never },
) {
  const { controllerProps, fieldProps } = props;
  const {
    field: { name, onChange, onBlur, value, ref },
    fieldState: { invalid, error },
  } = useController(controllerProps);

  return (
    <DecimalField
      name={name}
      value={value as unknown as DecimalString}
      onChange={onChange}
      onBlur={flow(onChange, onBlur)}
      inputRef={ref}
      error={invalid}
      helperText={error?.message ?? ' '}
      {...fieldProps}
    />
  );
}
