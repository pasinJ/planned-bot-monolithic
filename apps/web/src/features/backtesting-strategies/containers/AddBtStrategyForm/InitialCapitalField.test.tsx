import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { byRole, byText } from '#test-utils/selector';

import { InitialCapitalField } from './InitialCapitalField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function InitialCapitalFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <InitialCapitalField control={control} />;
}
function renderInitialCapitalField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<InitialCapitalFieldWrapper overrides={overrides} />);
}

const ui = {
  field: byRole('textbox', { name: /initial capital/i }),
  requiredError: byText(/initial capital is required/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = faker.number.float({ min: 0, max: 10 }).toString();
    renderInitialCapitalField({ initialCapital: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeVisible();
    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user type valid value', () => {
  it('THEN it should change the field value', async () => {
    const user = userEvent.setup();
    renderInitialCapitalField();

    const value = faker.number.float({ min: 0, max: 10 }).toString();
    const field = await ui.field.find();
    await user.clear(field);
    await user.type(field, value);

    expect(field).toHaveValue(value);
  });
});
describe('WHEN user type alphabet characters', () => {
  it('THEN it should not change value', async () => {
    const user = userEvent.setup();
    const defaultValue = faker.number.float({ min: 0, max: 10 }).toString();
    renderInitialCapitalField({ initialCapital: defaultValue });

    const field = await ui.field.find();
    await user.type(field, faker.string.alpha(1));

    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user clears the input', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderInitialCapitalField();

    const field = await ui.field.find();
    await user.clear(field);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
