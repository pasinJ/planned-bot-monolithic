/**
 * @jest-environment-options { "resources": "usable" }
 */
import { faker } from '@faker-js/faker';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mergeRight, values } from 'ramda';
import { useForm } from 'react-hook-form';

import { randomLanguage } from '#test-utils/domain';
import { randomString } from '#test-utils/faker';
import { createScriptsObserver, mockForMonaco, revertMockForMonaco } from '#test-utils/monaco';
import { byDisplayValue, byLabelText, byRole, byText } from '#test-utils/uiSelector';

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
  editor: byLabelText(/strategy body editor/i, { selector: 'textarea' }),
  bodyValue: (value: string | RegExp) => byDisplayValue(value),
  languageField: byLabelText(/language/i, { selector: 'input' }),
  // eslint-disable-next-line testing-library/no-node-access
  languageValue: (language: string) => document.querySelector(`div[data-mode-id="${language}"]`),
  languageDropdownButton: byRole('button', { name: /language/i }),
  languageOptionsList: byRole('listbox', { name: /language/i }),
  allLangaugeOptions: byRole('option'),
  requiredError: byText(/strategy body is required/i),
};

const { getScriptStatus, disconnect } = createScriptsObserver();
beforeAll(() => mockForMonaco());
afterAll(() => {
  revertMockForMonaco();
  disconnect();
});

describe('WHEN render', () => {
  it('THEN it should display language field', async () => {
    renderStrategyBodyField();

    await expect(ui.languageField.find()).resolves.toBeInTheDocument();
  });
  it('THEN it should display the field with default value and language', async () => {
    const body = randomString();
    const language = randomLanguage();
    renderStrategyBodyField({ body, language });

    const editor = await ui.editor.find();
    expect(editor).toBeInTheDocument();
    expect(ui.bodyValue(body).get()).toBeInTheDocument();
    expect(ui.languageValue(language)).not.toBeNull();
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

describe('WHEN user change language value', () => {
  it('THEN it should change the language mode', async () => {
    renderStrategyBodyField();

    const user = userEvent.setup();
    const dropdown = await ui.languageDropdownButton.find();
    await user.click(dropdown);
    const optionsList = await ui.languageOptionsList.find();
    const allOptions = await ui.allLangaugeOptions.findAll(optionsList);
    const optionToSelect = faker.helpers.arrayElement(
      allOptions.filter((e) => e.getAttribute('aria-selected') === 'false'),
    );
    await user.selectOptions(optionsList, optionToSelect);
    await user.keyboard('{tab}');

    await waitFor(
      () => {
        const status = getScriptStatus();
        // loader.js, editor/editor.main.js, editor/editor.main.nls.js, basic-language/..
        expect(values(status).length).toBeGreaterThanOrEqual(4);
        return expect(status).not.toContainValue(false);
      },
      { timeout: 2000, interval: 100 },
    );

    const selectedLanguage = optionToSelect.getAttribute('data-value') ?? '';
    expect(ui.languageValue(selectedLanguage)).not.toBeNull();
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
