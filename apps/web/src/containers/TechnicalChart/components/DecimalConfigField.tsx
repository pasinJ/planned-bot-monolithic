import { Control, Path, useController } from 'react-hook-form';

import DecimalField from '#components/DecimalField';
import { DecimalString } from '#shared/utils/string';

export default function DecimalConfidField<T extends Record<N, DecimalString>, N extends string>(props: {
  id: string;
  name: N;
  label: string;
  control: Control<T>;
}) {
  const { id, name, label, control } = props;

  const { field, fieldState } = useController({
    name: name as unknown as Path<T>,
    control,
    rules: { required: `${label} is required` },
  });
  const { value, ref: inputRef, onChange, ...restProps } = field;

  return (
    <DecimalField
      id={id}
      label={label}
      required
      value={value as DecimalString}
      {...restProps}
      onChange={onChange}
      onBlur={onChange}
      inputRef={inputRef}
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
    />
  );
}
