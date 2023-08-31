import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import { mergeRight, values } from 'ramda';
import { useForm } from 'react-hook-form';

import { exchangeNameEnum } from '#features/shared/domain/exchange';
import { byLabelText } from '#test-utils/selector';

import { ExchangeField } from './ExchangeField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function ExchangeFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <ExchangeField control={control} />;
}
function renderExchangeField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<ExchangeFieldWrapper overrides={overrides} />);
}

const ui = {
  field: byLabelText(/exchange/i, { selector: 'input' }),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    const defaultValue = faker.helpers.arrayElement(values(exchangeNameEnum));
    renderExchangeField();

    const field = await ui.field.find();
    expect(field).toBeInTheDocument();
    expect(field).toHaveValue(defaultValue);
    expect(field).toHaveAttribute('aria-disabled', 'true');
  });
});
