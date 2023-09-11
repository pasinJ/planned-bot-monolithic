import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { renderWithContexts } from '#test-utils/render';
import { byRole, byText } from '#test-utils/uiSelector';

import EndTimestampField from './EndTimestampField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function EndTimestampFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <EndTimestampField control={control} />;
}
function renderEndTimestampField(overrides?: Partial<AddBtStrategyFormValues>) {
  return renderWithContexts(<EndTimestampFieldWrapper overrides={overrides} />, ['Date']);
}

const ui = {
  field: byRole('textbox', { name: /end timestamp/i }),
  requiredError: byText(/end timestamp is required/i),
  beforeStartError: byText(/end timestamp must be after start timestamp/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = faker.date.recent();
    renderEndTimestampField({ endTimestamp: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeVisible();
    expect(field).toHaveValue(format(defaultValue, 'MM/dd/yyyy HH:mm'));
  });
});
describe('WHEN user clears the input', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderEndTimestampField();

    const field = await ui.field.find();
    await user.clear(field);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
describe('WHEN user selects end timestamp to be before start timestamp', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    const startTimestamp = faker.date.recent();
    renderEndTimestampField({ startTimestamp });

    const field = await ui.field.find();
    const endTimestamp = faker.date.recent({ refDate: startTimestamp });
    await user.type(field, format(endTimestamp, 'MM/dd/yyyy HH:mm'));

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.beforeStartError.find()).resolves.toBeVisible();
  });
});
