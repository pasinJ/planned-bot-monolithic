import { Control, Path, useController } from 'react-hook-form';

import IntegerField from '#components/IntegerField';
import { IntegerString } from '#shared/utils/string';

export default function IntegerConfidField<T extends Record<N, IntegerString>, N extends string>(props: {
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
    <IntegerField
      id={id}
      label={label}
      required
      value={value as IntegerString}
      {...restProps}
      onChange={onChange}
      onBlur={onChange}
      inputRef={inputRef}
      allowNegative={false}
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
    />
  );
}
