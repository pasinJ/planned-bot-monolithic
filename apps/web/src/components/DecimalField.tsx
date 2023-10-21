import TextField, { TextFieldProps } from '@mui/material/TextField';
import { ChangeEventHandler, FocusEventHandler } from 'react';

import { DecimalString } from '#shared/utils/string';

import { decimalStringLoose, formatDecimalString } from './DecimalField.util';

export default function DecimalField(props: Omit<TextFieldProps, 'value'> & { value: DecimalString }) {
  const { value, onChange, onBlur, ...restProps } = props;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    e.target.value = decimalStringLoose.catch(value).parse(e.target.value);
    if (onChange) onChange(e);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    e.target.value = formatDecimalString(e.target.value);
    if (onBlur) onBlur(e);
  };

  return <TextField value={value} onChange={handleChange} onBlur={handleBlur} {...restProps} />;
}
