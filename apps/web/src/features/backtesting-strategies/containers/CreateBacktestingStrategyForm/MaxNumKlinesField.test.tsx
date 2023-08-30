import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { byRole, byText } from '#test-utils/selector';

import { MaxNumKlinesField } from './MaxNumKlinesField';
import { FormValues, defaultValues } from './constants';

function MaxNumKlinesFieldWrapper({ overrides }: { overrides?: Partial<FormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <MaxNumKlinesField control={control} />;
}
function renderMaxNumKlinesField(overrides?: Partial<FormValues>) {
  return render(<MaxNumKlinesFieldWrapper overrides={overrides} />);
}

const ui = {
  field: byRole('textbox', { name: /maximum number of candlesticks/i }),
  requiredError: byText(/this field is required/i),
  lessThan1Error: byText(/this field must be greater than 0/i),
};

describe('WHEN render', () => {
  it('THEN it should have the maximum number of candlesticks input field inside the form', async () => {
    const defaultValue = faker.number.int(10).toString();
    renderMaxNumKlinesField({ maxNumKlines: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeVisible();
    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user type valid value', () => {
  it('THEN it should change the field value', async () => {
    const user = userEvent.setup();
    renderMaxNumKlinesField();

    const value = faker.number.int({ min: 0, max: 100 }).toString();
    const field = await ui.field.find();
    await user.clear(field);
    await user.type(field, value);

    expect(field).toHaveValue(value);
  });
});
describe('WHEN user type alphabet characters', () => {
  it('THEN it should not change display value', async () => {
    const user = userEvent.setup();
    const defaultValue = faker.number.int(10).toString();
    renderMaxNumKlinesField({ maxNumKlines: defaultValue });

    const field = await ui.field.find();
    await user.type(field, faker.string.alpha(1));

    expect(field).toHaveDisplayValue(defaultValue);
  });
});
describe('WHEN user type minus sign', () => {
  it('THEN it should not change display value', async () => {
    const user = userEvent.setup();
    const defaultValue = faker.number.int(10).toString();
    renderMaxNumKlinesField({ maxNumKlines: defaultValue });

    const field = await ui.field.find();
    await user.type(field, '-', { initialSelectionStart: 0, initialSelectionEnd: 0 });

    expect(field).toHaveDisplayValue(defaultValue);
  });
});
describe('WHEN user type zero', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderMaxNumKlinesField();

    const field = await ui.field.find();
    await user.clear(field);
    await user.type(field, '0');

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.lessThan1Error.find()).resolves.toBeVisible();
  });
});
describe('WHEN user clears the input', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderMaxNumKlinesField();

    const field = await ui.field.find();
    await user.clear(field);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
