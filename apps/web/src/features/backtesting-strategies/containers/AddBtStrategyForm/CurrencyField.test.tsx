import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { generateArrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/features/symbols/domain';
import { byLabelText, byRole, byText } from '#test-utils/uiSelector';

import CurrencyField from './CurrencyField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function CurrencyFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <CurrencyField control={control} symbols={symbols} />;
}
function renderCurrencyField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<CurrencyFieldWrapper overrides={overrides} />);
}

const symbols = generateArrayOf(mockSymbol, 3);
const ui = {
  field: byLabelText(/base currency/i, { selector: 'input' }),
  dropdownButton: byRole('combobox', { name: /base currency/i }),
  optionsList: byRole('listbox', { name: /base currency/i }),
  allOptions: byRole('option'),
  option: (name: string | RegExp) => byRole('option', { name }),
  requiredError: byText(/base currency is required/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = '';
    renderCurrencyField({ currency: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeInTheDocument();
    expect(field).toHaveValue(defaultValue);
  });
});
describe('GIVEN user has not selected symbol option WHEN user click currency input dropdown', () => {
  it('THEN it should display only none options', async () => {
    const user = userEvent.setup();
    renderCurrencyField({ symbol: null });

    const dropdown = await ui.dropdownButton.find();
    await user.click(dropdown);

    const optionsList = await ui.optionsList.find();
    await expect(ui.allOptions.findAll(optionsList)).resolves.toBeArrayOfSize(1);
  });
});
describe('GIVEN user has selected symbol option WHEN user click currency input dropdown', () => {
  it('THEN it should display options with base asset and quote asset of selected symbol', async () => {
    const user = userEvent.setup();
    const selectedSymbol = faker.helpers.arrayElement(symbols);
    renderCurrencyField({ symbol: selectedSymbol.name });

    const dropdown = await ui.dropdownButton.find();
    await user.click(dropdown);

    const optionsList = await ui.optionsList.find();
    await expect(ui.option(selectedSymbol.baseAsset).find(optionsList)).resolves.toBeVisible();
    await expect(ui.option(selectedSymbol.quoteAsset).find(optionsList)).resolves.toBeVisible();
  });
});
describe('WHEN user click currency input dropdown and left without select any option', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderCurrencyField({ symbol: null });

    const dropdown = await ui.dropdownButton.find();
    await user.click(dropdown);
    await user.keyboard('{tab}{tab}');

    const field = await ui.field.find();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
