import { formatIntegerString, integerStringLoose, nonNegativeIntegerStringLoose } from './IntegerField.util';

describe('Non-negative integer string loose', () => {
  it.each([{ value: '' }, { value: '0' }, { value: '01' }, { value: '123' }, { value: '100' }])(
    "WHEN parse with value = '$value' THEN it should return the value",
    ({ value }) => {
      expect(nonNegativeIntegerStringLoose.parse(value)).toEqual(value);
    },
  );
  it.each([
    { value: 'string' },
    { value: 'string123' },
    { value: '-1' },
    { value: '1.0' },
    { value: null },
    { value: undefined },
  ])("WHEN parse with value ='$value' THEN it should throw an error", ({ value }) => {
    expect(() => nonNegativeIntegerStringLoose.parse(value)).toThrow();
  });
});

describe('Integer string loose', () => {
  it.each([
    { value: '' },
    { value: '0' },
    { value: '01' },
    { value: '-01' },
    { value: '123' },
    { value: '100' },
  ])("WHEN parse with value = '$value' THEN it should return the value", ({ value }) => {
    expect(integerStringLoose.parse(value)).toEqual(value);
  });
  it.each([
    { value: 'string' },
    { value: 'string123' },
    { value: '--1' },
    { value: '1.0' },
    { value: null },
    { value: undefined },
  ])("WHEN parse with value ='$value' THEN it should throw an error", ({ value }) => {
    expect(() => integerStringLoose.parse(value)).toThrow();
  });
});

describe('Format string to integer string', () => {
  it.each([
    { input: '0', output: '0' },
    { input: '001', output: '1' },
    { input: '-01', output: '-1' },
    { input: '-10', output: '-10' },
    { input: '100', output: '100' },
  ])("WHEN format value = '$input' THEN it should return '$output'", ({ input, output }) => {
    expect(formatIntegerString(input)).toEqual(output);
  });
});
