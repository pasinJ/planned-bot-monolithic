import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { byRole, byText } from '#test-utils/uiSelector';

import { StrategyNameField } from './StrategyNameField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function StrategyNameFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <StrategyNameField control={control} />;
}
function renderStrategyNameField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<StrategyNameFieldWrapper overrides={overrides} />);
}

const ui = {
  field: byRole('textbox', { name: /strategy name/i }),
  requiredError: byText(/strategy name is required/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = faker.string.alpha(5);
    renderStrategyNameField({ name: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeVisible();
    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user type value', () => {
  it('THEN it should change the field value', async () => {
    const user = userEvent.setup();
    renderStrategyNameField();

    const value = faker.string.alpha(5);
    const field = await ui.field.find();
    await user.clear(field);
    await user.type(field, value);

    expect(field).toHaveValue(value);
  });
});
describe('WHEN user clears the input', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderStrategyNameField({ name: faker.string.alpha(5) });

    const field = await ui.field.find();
    await user.clear(field);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
