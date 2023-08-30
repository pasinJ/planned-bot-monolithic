import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight, values } from 'ramda';
import { useForm } from 'react-hook-form';

import { timeframeEnum } from '#features/shared/domain/timeframe';
import { byLabelText, byRole, byText } from '#test-utils/selector';

import { TimeframeField } from './TimeframeField';
import { FormValues, defaultValues } from './constants';

function TimeframeFieldWrapper({ overrides }: { overrides?: Partial<FormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <TimeframeField control={control} />;
}
function renderTimeframeField(overrides?: Partial<FormValues>) {
  return render(<TimeframeFieldWrapper overrides={overrides} />);
}

const ui = {
  field: byLabelText(/timeframe/i, { selector: 'input' }),
  dropdownButton: byRole('button', { name: /timeframe/i }),
  optionsList: byRole('listbox', { name: /timeframe/i }),
  allOptions: byRole('option'),
  requiredError: byText(/timeframe is required/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = faker.helpers.arrayElement(values(timeframeEnum));
    renderTimeframeField({ timeframe: defaultValue });

    const field = await ui.field.find();
    expect(field).toBeInTheDocument();
    expect(field).toHaveValue(defaultValue);
  });
});
describe('WHEN user click currency input dropdown and left without select any option', () => {
  it('THEN it should be in error state and display error message', async () => {
    const user = userEvent.setup();
    renderTimeframeField();

    const dropdown = await ui.dropdownButton.find();
    await user.click(dropdown);
    await user.keyboard('{tab}{tab}');

    const field = await ui.field.find();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
describe('WHEN user selects an option', () => {
  it('THEN it should change the value of the field', async () => {
    const user = userEvent.setup();
    renderTimeframeField();

    const dropdown = await ui.dropdownButton.find();
    await user.click(dropdown);
    const optionsList = await ui.optionsList.find();
    const allOptions = await ui.allOptions.findAll(optionsList);
    const selectedOption = faker.helpers.arrayElement(allOptions);
    await user.selectOptions(optionsList, selectedOption);
    await user.keyboard('{tab}');

    const field = await ui.field.find();
    expect(field).toHaveValue(selectedOption.getAttribute('data-value'));
  });
});
