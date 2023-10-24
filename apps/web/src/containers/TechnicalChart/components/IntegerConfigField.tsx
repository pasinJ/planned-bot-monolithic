import { flow } from 'fp-ts/lib/function';
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

  const {
    field: { value, ref: inputRef, onChange, onBlur, ...restProps },
    fieldState,
  } = useController({
    name: name as unknown as Path<T>,
    control,
    rules: {
      required: `${label} is required`,
      validate: (value) => (Number(value) <= 0 ? `${label} must be greater than 0` : true),
    },
  });

  return (
    <IntegerField
      id={id}
      label={label}
      required
      value={value as IntegerString}
      {...restProps}
      onChange={onChange}
      onBlur={flow(onChange, onBlur)}
      inputRef={inputRef}
      allowNegative={false}
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
    />
  );
}
