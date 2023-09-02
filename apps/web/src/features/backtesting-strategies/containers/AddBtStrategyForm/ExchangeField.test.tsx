import { render } from '@testing-library/react';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { randomExchangeName } from '#test-utils/domain';
import { byLabelText } from '#test-utils/uiSelector';

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
    const defaultValue = randomExchangeName();
    renderExchangeField();

    const field = await ui.field.find();
    expect(field).toBeInTheDocument();
    expect(field).toHaveValue(defaultValue);
    expect(field).toHaveAttribute('aria-disabled', 'true');
  });
});
