import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { randomLanguage } from '#test-utils/domain';
import { byLabelText, byRole } from '#test-utils/uiSelector';

import StrategyLanguageField from './StrategyLanguageField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function StrategyLanguageFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });
  return <StrategyLanguageField control={control} />;
}
function renderStrategyLanguageField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<StrategyLanguageFieldWrapper overrides={overrides} />);
}

const ui = {
  field: byLabelText(/language/i, { selector: 'input' }),
  dropdownButton: byRole('combobox', { name: /language/i }),
  optionsList: byRole('listbox', { name: /language/i }),
  allOptions: byRole('option'),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = randomLanguage();
    renderStrategyLanguageField({ language: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeInTheDocument();
    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user selects an option', () => {
  it('THEN it should change the value of the field', async () => {
    renderStrategyLanguageField();

    const dropdown = await ui.dropdownButton.find();
    const user = userEvent.setup();
    await user.click(dropdown);
    const optionsList = await ui.optionsList.find();
    const allOptions = await ui.allOptions.findAll(optionsList);
    const optionToSelect = faker.helpers.arrayElement(allOptions);
    await user.selectOptions(optionsList, optionToSelect);
    await user.keyboard('{tab}');

    const field = await ui.field.find();
    expect(field).toHaveValue(optionToSelect.getAttribute('data-value'));
  });
});
