import { decimalStringLoose, formatDecimalString } from './DecimalField.util';

describe('Decimal string loose', () => {
  it.each([
    { value: '0' },
    { value: '01' },
    { value: '123' },
    { value: '100' },
    { value: '1.' },
    { value: '.1' },
    { value: '0.1' },
    { value: '0.100' },
    { value: '0.101' },
    { value: '000.100' },
  ])("WHEN parse with value = '$value' THEN it should return the value", ({ value }) => {
    expect(decimalStringLoose.parse(value)).toEqual(value);
  });
  it.each([
    { value: 'string' },
    { value: 'string123' },
    { value: '1.1.0' },
    { value: null },
    { value: undefined },
  ])("WHEN parse with value ='$value' THEN it should throw an error", ({ value }) => {
    expect(() => decimalStringLoose.parse(value)).toThrow();
  });
});

describe('Format string to decimal string', () => {
  it.each([
    { input: '0', output: '0' },
    { input: '01', output: '1' },
    { input: '123', output: '123' },
    { input: '100', output: '100' },
    { input: '1.', output: '1.0' },
    { input: '.1', output: '0.1' },
    { input: '.', output: '0.0' },
    { input: '0.101', output: '0.101' },
    { input: '0.100', output: '0.1' },
    { input: '000.1', output: '0.1' },
    { input: '000.100', output: '0.1' },
  ])("WHEN format value = '$input' THEN it should return '$output'", ({ input, output }) => {
    expect(formatDecimalString(input)).toEqual(output);
  });
});
