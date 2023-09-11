import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { byRole, byText } from '#test-utils/uiSelector';

import MakerFeeRateField from './MakerFeeRateField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function MakerFeeRateFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <MakerFeeRateField control={control} />;
}
function renderMakerFeeRateField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<MakerFeeRateFieldWrapper overrides={overrides} />);
}

const ui = {
  field: byRole('textbox', { name: /maker fee rate/i }),
  requiredError: byText(/maker fee rate is required/i),
  moreThan100Error: byText(/fee rate must be between 0 and 100/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = faker.string.numeric(2);
    renderMakerFeeRateField({ makerFeeRate: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeVisible();
    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user type valid value', () => {
  it('THEN it should change the field value', async () => {
    const user = userEvent.setup();
    renderMakerFeeRateField();

    const value = faker.number.int({ min: 0, max: 100 }).toString();
    const field = await ui.field.find();
    await user.clear(field);
    await user.type(field, value);

    expect(field).toHaveValue(value);
  });
});
describe('WHEN user type alphabet characters', () => {
  it('THEN it should not change value', async () => {
    const user = userEvent.setup();
    const defaultValue = faker.string.alphanumeric(2);
    renderMakerFeeRateField({ makerFeeRate: defaultValue });

    const field = await ui.field.find();
    await user.type(field, faker.string.alpha(1));

    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user clears the input', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderMakerFeeRateField();

    const field = await ui.field.find();
    await user.clear(field);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
describe('WHEN user type value more than 100', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderMakerFeeRateField();

    const value = faker.number.int({ min: 101 }).toString();
    const field = await ui.field.find();
    await user.clear(field);
    await user.type(field, value);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.moreThan100Error.find()).resolves.toBeVisible();
  });
});
