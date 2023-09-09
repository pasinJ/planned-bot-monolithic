/**
 * @jest-environment-options { "resources": "usable" }
 */
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight } from 'ramda';
import { useForm } from 'react-hook-form';

import { randomString } from '#test-utils/faker';
import { mockForMonaco, monitorWarning, revertMockForMonaco } from '#test-utils/monaco';
import { byDisplayValue, byLabelText, byText } from '#test-utils/uiSelector';

import { StrategyBodyField } from './StrategyBodyField';
import { AddBtStrategyFormValues, defaultValues } from './constants';

function StrategyBodyFieldWrapper({ overrides }: { overrides?: Partial<AddBtStrategyFormValues> }) {
  const { control } = useForm({ defaultValues: mergeRight(defaultValues, overrides ?? {}), mode: 'all' });
  return <StrategyBodyField control={control} />;
}
function renderStrategyBodyField(overrides?: Partial<AddBtStrategyFormValues>) {
  return render(<StrategyBodyFieldWrapper overrides={overrides} />);
}

beforeAll(() => {
  mockForMonaco();
  monitorWarning();
});
afterAll(() => revertMockForMonaco());

const ui = {
  editor: byLabelText(/strategy body editor/i, { selector: 'textarea' }),
  bodyValue: (value: string | RegExp) => byDisplayValue(value),
  requiredError: byText(/strategy body is required/i),
};

describe('WHEN render', () => {
  it('THEN it should display the field with default value', async () => {
    renderStrategyBodyField();

    const editor = await ui.editor.find();
    expect(editor).toBeInTheDocument();
  });
});

describe('WHEN user type value', () => {
  it('THEN it should change the field value', async () => {
    renderStrategyBodyField();

    const user = userEvent.setup();
    const body = 'console.log("Hello");';
    const editor = await ui.editor.find();
    await user.type(editor, body);

    expect(ui.bodyValue(body).get()).toBeInTheDocument();
  });
});

describe('WHEN user clears the input', () => {
  it('THEN it should display error message', async () => {
    renderStrategyBodyField();

    const user = userEvent.setup();
    const body = randomString();
    const editor = await ui.editor.find();
    await user.type(editor, body);

    expect(ui.bodyValue(body).get()).toBeInTheDocument();

    await user.type(editor, `{Backspace>${body.length}/}`);

    expect(ui.bodyValue('').get()).toBeInTheDocument();
    await expect(ui.requiredError.find()).resolves.toBeVisible();
  });
});
