import TextField, { TextFieldProps } from '@mui/material/TextField';
import { ChangeEventHandler, FocusEventHandler } from 'react';

import { IntegerString } from '#shared/utils/string';

import { formatIntegerString, integerStringLoose, nonNegativeIntegerStringLoose } from './IntegerField.util';

export type IntegerFieldProps = Omit<TextFieldProps, 'value'> & {
  value: IntegerString;
  allowNegative?: boolean;
};

export default function IntegerField(props: IntegerFieldProps) {
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
