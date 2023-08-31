import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { clickAutoCompleteDropdown } from '#test-utils/events';
import { arrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/mockValueObject';
import { byRole, byText } from '#test-utils/selector';

import { SymbolField } from './SymbolField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function SymbolFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <SymbolField control={control} symbols={symbols} />;
}
function renderSymbolField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<SymbolFieldWrapper overrides={overrides} />);
}

const symbols = arrayOf(mockSymbol, 3);
const ui = {
  field: byRole('combobox', { name: /symbol/i }),
  openSymbolDropDown: () => clickAutoCompleteDropdown(/symbol/i),
  allOptions: byRole('option'),
  requiredError: byText(/symbol is required/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = faker.helpers.arrayElement(symbols).name;
    renderSymbolField({ symbol: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeInTheDocument();
    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user click symbol input dropdown', () => {
  it('THEN it should display all symbol options', async () => {
    renderSymbolField();

    await ui.openSymbolDropDown();

    const allOptions = await ui.allOptions.findAll();
    expect(allOptions).toBeArrayOfSize(symbols.length);
  });
});
describe('WHEN user click symbol input dropdown and left without select any option', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderSymbolField();

    await ui.openSymbolDropDown();
    await user.keyboard('{tab}');

    const field = await ui.field.find();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
