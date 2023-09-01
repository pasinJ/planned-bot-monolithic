import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { renderWithContexts } from '#test-utils/render';
import { byRole, byText } from '#test-utils/uiSelector';

import { StartTimestampField } from './StartTimestampField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function StartTimestampFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <StartTimestampField control={control} />;
}
function renderStartTimestampField(overrides?: Partial<AddBtStrategyFormValues>) {
  return renderWithContexts(<StartTimestampFieldWrapper overrides={overrides} />, ['Date']);
}

const ui = {
  field: byRole('textbox', { name: /start timestamp/i }),
  requiredError: byText(/start timestamp is required/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = faker.date.recent();
    renderStartTimestampField({ startTimestamp: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeVisible();
    expect(field).toHaveValue(format(defaultValue, 'MM/dd/yyyy HH:mm'));
  });
});
describe('WHEN user clears the input', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderStartTimestampField();

    const field = await ui.field.find();
    await user.clear(field);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
