import TextField, { TextFieldProps } from '@mui/material/TextField';
import { ChangeEventHandler, FocusEventHandler } from 'react';

import { formatIntegerString, integerStringLoose, nonNegativeIntegerStringLoose } from './IntegerField.util';

export default function IntegerField(
  props: Omit<TextFieldProps, 'value'> & { value: string; allowNegative?: boolean },
) {
  const { value, onChange, onBlur, allowNegative, ...restProps } = props;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    e.target.value =
      allowNegative ?? false
        ? integerStringLoose.catch(value).parse(e.target.value)
        : nonNegativeIntegerStringLoose.catch(value).parse(e.target.value);
    if (onChange) onChange(e);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    e.target.value = formatIntegerString(e.target.value);
    if (onBlur) onBlur(e);
  };

  return <TextField value={value} onChange={handleChange} onBlur={handleBlur} {...restProps} />;
}
