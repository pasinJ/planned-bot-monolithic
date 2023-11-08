import { flow } from 'fp-ts/lib/function';
import { FieldPathValue, FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

import { IntegerString } from '#shared/utils/string';

import IntegerField, { IntegerFieldProps } from './IntegerField';

type IntegerFieldRfProps<T extends FieldValues, N extends Path<T>> = {
  controllerProps: UseControllerProps<T, N>;
  fieldProps: Omit<IntegerFieldProps, 'value'>;
};

export default function IntegerFieldRf<T extends FieldValues, N extends Path<T>>(
  props: FieldPathValue<T, N> extends IntegerString
    ? IntegerFieldRfProps<T, N>
    : IntegerFieldRfProps<T, N> & { __fieldMustBeIntegerString: never },
) {
  const { controllerProps, fieldProps } = props;
  const {
    field: { name, onChange, onBlur, value, ref },
    fieldState: { invalid, error },
  } = useController(controllerProps);

  return (
    <IntegerField
      name={name}
      value={value as unknown as IntegerString}
      onChange={onChange}
      onBlur={flow(onChange, onBlur)}
      inputRef={ref}
      error={invalid}
      helperText={error?.message ?? ' '}
      {...fieldProps}
    />
  );
}
