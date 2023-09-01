import { render } from '@testing-library/react';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { byLabelText } from '#test-utils/uiSelector';

import { StrategyBodyField } from './StrategyBodyField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function StrategyBodyFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });

  return <StrategyBodyField control={control} />;
}
function renderStrategyBodyField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<StrategyBodyFieldWrapper overrides={overrides} />);
}

const ui = {
  field: byLabelText(/strategy body/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    renderStrategyBodyField();

    const field = await ui.field.find();
    expect(field).toBeInTheDocument();
  });
});
