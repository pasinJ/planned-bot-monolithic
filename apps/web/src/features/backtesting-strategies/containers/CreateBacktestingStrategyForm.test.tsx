import { faker } from '@faker-js/faker';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as te from 'fp-ts/lib/TaskEither';

import { API_ENDPOINTS } from '#features/symbols/repositories/symbol.constant';
import { HttpClient } from '#infra/httpClient.type';
import { clickAutoCompleteDropdown, selectOptionAutoComplete } from '#test-utils/events';
import { arrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/mockValueObject';
import { renderWithContexts } from '#test-utils/render';
import { byLabelText, byRole, byTestId, byText } from '#test-utils/selector';

import CreateBacktestingStrategyForm from './CreateBacktestingStrategyForm';

const { GET_SYMBOLS } = API_ENDPOINTS;

function renderForm(overrides?: { httpClient: HttpClient }) {
  return renderWithContexts(
    <CreateBacktestingStrategyForm />,
    ['Infra', 'ServerState', 'Date'],
    overrides
      ? { infraContext: { httpClient: overrides.httpClient } }
      : { infraContext: { httpClient: { sendRequest: jest.fn().mockReturnValueOnce(te.right(undefined)) } } },
  );
}
function renderFormSuccess() {
  const symbols = arrayOf(mockSymbol, 4);
  const httpClient = { sendRequest: jest.fn().mockReturnValueOnce(te.right(symbols)) };
  renderForm({ httpClient });

  return { httpClient, symbols };
}

const ui = {
  form: byRole('form', { name: /create backtesting strategy/i }),
  nameField: byRole('textbox', { name: /strategy name/i }),
  nameFieldRequiredError: byText(/strategy name is required/i),
  exchangeField: byLabelText(/exchange/i),
  symbolField: byRole('combobox', { name: /symbol/i }),
  openSymbolDropDown: () => clickAutoCompleteDropdown(/symbol/i),
  selectSymbol: async (value: string) => selectOptionAutoComplete(/symbol/i, value),
  symbolOption: (value?: string | RegExp) => byRole('option', { name: value }),
  symbolFieldRequiredError: byText(/symbol is required/i),
  currencyField: byTestId('currency-field'),
  findCurrencyFieldInput: () => byTestId('currency-input').find(screen.getByTestId('currency-field')),
  findCurrencyFieldDropdown: () =>
    byRole('button', { name: /currency/i }).find(screen.getByTestId('currency-field')),
  currencyOptionList: byRole('listbox', { name: /currency/i }),
  currencyFieldRequiredError: byText(/currency is required/i),
  takerFeeRateField: byRole('textbox', { name: /taker fee rate/i }),
  takerFeeRateFieldRequiredError: byText(/taker fee rate is required/i),
  makerFeeRateField: byRole('textbox', { name: /maker fee rate/i }),
  makerFeeRateFieldRequiredError: byText(/maker fee rate is required/i),
  feeRateFieldExceedMaxError: byText(/fee rate must be between 0 and 100/i),
  maxNumCandlesticksField: byRole('textbox', { name: /maximum number of candlesticks/i }),
  maxNumCandlesticksFieldRequiredError: byText(/this field is required/i),
  startTimestampField: byRole('textbox', { name: /start timestamp/i }),
  startTimestampFieldRequiredError: byText(/start timestamp is required/i),
  endTimestampField: byRole('textbox', { name: /end timestamp/i }),
  endTimestampFieldRequiredError: byText(/end timestamp is required/i),
  endTimestampFieldBeforeError: byText(/end timestamp must be after start timestamp/i),
};

describe('Create backtesting strategy form', () => {
  describe('WHEN render', () => {
    it('THEN it should try to get symbols for symbol select input', () => {
      const { httpClient } = renderFormSuccess();

      expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith(GET_SYMBOLS);
    });
    it('THEN it should display a create backtesting strategy form', async () => {
      renderFormSuccess();

      await expect(ui.form.find()).resolves.toBeVisible();
    });
  });
});

describe('Strategy name field', () => {
  describe('WHEN render', () => {
    it('THEN it should have name input field inside form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const nameField = await ui.nameField.find(form);
      expect(nameField).toBeVisible();
      expect(nameField).toHaveDisplayValue('');
    });
  });
  describe('WHEN user clears the input', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const nameField = await ui.nameField.find();
      const user = userEvent.setup();
      await user.type(nameField, faker.string.alpha());
      await user.clear(nameField);

      expect(nameField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.nameFieldRequiredError.find()).resolves.toBeVisible();
    });
  });
});

describe('Exchange field', () => {
  describe('WHEN render', () => {
    it('THEN it should have exchange input field inside the form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const exchangeField = await ui.exchangeField.find(form);
      expect(exchangeField).toBeVisible();
      expect(exchangeField).toHaveAttribute('aria-disabled', 'true');
    });
  });
});

describe('Symbol field', () => {
  describe('WHEN render', () => {
    it('THEN it should have symbol input field with options inside the form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const symbolField = await ui.symbolField.find(form);
      expect(symbolField).toBeVisible();
      expect(symbolField).toHaveDisplayValue('');
    });
  });
  describe('WHEN user click symbol input dropdown', () => {
    it('THEN it should display fetched options', async () => {
      const { symbols } = renderFormSuccess();

      await ui.openSymbolDropDown();

      await Promise.all(
        symbols.map((symbol) => expect(ui.symbolOption(symbol.name).find()).resolves.toBeVisible()),
      );
    });
  });
  describe('WHEN user click symbol input dropdown and left without select any option', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      await ui.openSymbolDropDown();
      const user = userEvent.setup();
      await user.click(document.body);

      const symbolField = await ui.symbolField.find();
      expect(symbolField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.symbolFieldRequiredError.find()).resolves.toBeVisible();
    });
  });
});

describe('Currency field', () => {
  describe('WHEN render', () => {
    it('THEN it should have currency input field inside the form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const currencyField = await ui.currencyField.find(form);
      expect(currencyField).toBeVisible();
      const currencyFieldInput = await ui.findCurrencyFieldInput();
      expect(currencyFieldInput).toHaveDisplayValue('');
    });
  });
  describe('GIVEN user have not selected symbol option WHEN user click currency input dropdown', () => {
    it('THEN it should display only none options', async () => {
      renderFormSuccess();

      const currencyFieldDrowdown = await ui.findCurrencyFieldDropdown();
      const user = userEvent.setup();
      await user.click(currencyFieldDrowdown);

      const currencyOptionsList = await ui.currencyOptionList.find();
      await expect(ui.symbolOption(undefined).findAll(currencyOptionsList)).resolves.toBeArrayOfSize(1);
    });
  });
  describe('GIVEN user have selected symbol option WHEN user click currency input dropdown', () => {
    it('THEN it should display options with base asset and quote asset of selected symbol', async () => {
      const { symbols } = renderFormSuccess();
      const selectedSymbol = symbols[0];

      await ui.selectSymbol(selectedSymbol.name);

      const currencyFieldDrowdown = await ui.findCurrencyFieldDropdown();
      const user = userEvent.setup();
      await user.click(currencyFieldDrowdown);
      const currencyOptionList = await ui.currencyOptionList.find();

      await expect(
        within(currencyOptionList).findByRole('option', { name: selectedSymbol.baseAsset }),
      ).resolves.toBeVisible();
      await expect(
        within(currencyOptionList).findByRole('option', { name: selectedSymbol.quoteAsset }),
      ).resolves.toBeVisible();
    });
  });
  describe('WHEN user click currency input dropdown and left without select any option', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const currencyFieldDrowdown = await ui.findCurrencyFieldDropdown();
      const user = userEvent.setup();
      await user.click(currencyFieldDrowdown);
      await user.keyboard('{tab}{tab}');

      const currencyFieldInput = await ui.findCurrencyFieldInput();
      expect(currencyFieldInput).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.currencyFieldRequiredError.find()).resolves.toBeVisible();
    });
  });
});

describe('Taker fee rate field', () => {
  describe('WHEN render', () => {
    it('THEN it should have taker fee rate input field inside form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const takerFeeRateField = await ui.takerFeeRateField.find(form);
      expect(takerFeeRateField).toBeVisible();
      expect(takerFeeRateField).toHaveDisplayValue('0.0');
    });
  });
  describe('WHEN user type alphabet characters', () => {
    it('THEN it should not change display value', async () => {
      renderFormSuccess();

      const takerFeeRateField = await ui.takerFeeRateField.find();
      const user = userEvent.setup();
      await user.type(takerFeeRateField, faker.string.alpha(3));

      expect(takerFeeRateField).toHaveDisplayValue('0.0');
    });
  });
  describe('WHEN user clears the input', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const takerFeeRateField = await ui.takerFeeRateField.find();
      const user = userEvent.setup();
      await user.clear(takerFeeRateField);

      expect(takerFeeRateField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.takerFeeRateFieldRequiredError.find()).resolves.toBeVisible();
    });
  });
  describe('WHEN user type value more than 100', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const takerFeeRateField = await ui.takerFeeRateField.find();
      const user = userEvent.setup();
      await user.clear(takerFeeRateField);
      await user.type(takerFeeRateField, '101');

      expect(takerFeeRateField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.feeRateFieldExceedMaxError.find()).resolves.toBeVisible();
    });
  });
});

describe('Maker fee rate field', () => {
  describe('WHEN render', () => {
    it('THEN it should have maker fee rate input field inside form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const makerFeeRateField = await ui.makerFeeRateField.find(form);
      expect(makerFeeRateField).toBeVisible();
      expect(makerFeeRateField).toHaveDisplayValue('0.0');
    });
  });
  describe('WHEN user type alphabet characters', () => {
    it('THEN it should not change display value', async () => {
      renderFormSuccess();

      const makerFeeRateField = await ui.makerFeeRateField.find();
      const user = userEvent.setup();
      await user.type(makerFeeRateField, faker.string.alpha(3));

      expect(makerFeeRateField).toHaveDisplayValue('0.0');
    });
  });
  describe('WHEN user clear the input', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const makerFeeRateField = await ui.makerFeeRateField.find();
      const user = userEvent.setup();
      await user.clear(makerFeeRateField);

      expect(makerFeeRateField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.makerFeeRateFieldRequiredError.find()).resolves.toBeVisible();
    });
  });
  describe('WHEN user type value more than 100', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const makerFeeRateField = await ui.makerFeeRateField.find();
      const user = userEvent.setup();
      await user.clear(makerFeeRateField);
      await user.type(makerFeeRateField, '101');

      expect(makerFeeRateField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.feeRateFieldExceedMaxError.find()).resolves.toBeVisible();
    });
  });
});

describe('Maximum number of candlesticks per execution field', () => {
  describe('WHEN render', () => {
    it('THEN it should have the maximum number of candlesticks input field inside the form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const maxNumCandlesticks = await ui.maxNumCandlesticksField.find(form);
      expect(maxNumCandlesticks).toBeVisible();
      expect(maxNumCandlesticks).toHaveDisplayValue('100');
    });
  });
  describe('WHEN user type alphabet characters', () => {
    it('THEN it should not change display value', async () => {
      renderFormSuccess();

      const maxNumCandlesticksField = await ui.maxNumCandlesticksField.find();
      const user = userEvent.setup();
      await user.type(maxNumCandlesticksField, faker.string.alpha(3));

      expect(maxNumCandlesticksField).toHaveDisplayValue('100');
    });
  });
  describe('WHEN user type minus sign', () => {
    it('THEN it should not change display value', async () => {
      renderFormSuccess();

      const maxNumCandlesticksField = await ui.maxNumCandlesticksField.find();
      const user = userEvent.setup();
      await user.type(maxNumCandlesticksField, '-', { initialSelectionStart: 0, initialSelectionEnd: 0 });

      expect(maxNumCandlesticksField).toHaveDisplayValue('100');
    });
  });
  describe('WHEN user type valid number', () => {
    it('THEN it should change display value', async () => {
      renderFormSuccess();

      const maxNumCandlesticksField = await ui.maxNumCandlesticksField.find();
      const user = userEvent.setup();
      await user.type(maxNumCandlesticksField, '1');

      expect(maxNumCandlesticksField).toHaveDisplayValue('1001');
    });
  });
  describe('WHEN user clears the input', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const maxNumCandlesticksField = await ui.maxNumCandlesticksField.find();
      const user = userEvent.setup();
      await user.clear(maxNumCandlesticksField);

      expect(maxNumCandlesticksField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.maxNumCandlesticksFieldRequiredError.find()).resolves.toBeVisible();
    });
  });
});

describe('Start timestamp field', () => {
  describe('WHEN render', () => {
    it('THEN it should display start timestamp input field inside the form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const startTimestampField = await ui.startTimestampField.find(form);

      expect(startTimestampField).toBeVisible();
    });
  });
  describe('WHEN user clears the input', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const startTimestampField = await ui.startTimestampField.find();
      const user = userEvent.setup();
      await user.clear(startTimestampField);

      expect(startTimestampField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.startTimestampFieldRequiredError.find()).resolves.toBeVisible();
    });
  });
});

describe('End timestamp field', () => {
  describe('WHEN render', () => {
    it('THEN it should display end timestamp input field inside the form', async () => {
      renderFormSuccess();

      const form = await ui.form.find();
      const endTimestampField = await ui.endTimestampField.find(form);

      expect(endTimestampField).toBeVisible();
    });
  });
  describe('WHEN user clears the input', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const endTimestampField = await ui.endTimestampField.find();
      const user = userEvent.setup();
      await user.clear(endTimestampField);

      expect(endTimestampField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.endTimestampFieldRequiredError.find()).resolves.toBeVisible();
    });
  });
  describe('WHEN user select end timestamp to be before start timestamp', () => {
    it('THEN it should be in error state and display error message', async () => {
      renderFormSuccess();

      const endTimestampField = await ui.endTimestampField.find();
      const user = userEvent.setup();
      await user.type(endTimestampField, '01/01/1990 00:00');

      expect(endTimestampField).toHaveAttribute('aria-invalid', 'true');
      await expect(ui.endTimestampFieldBeforeError.find()).resolves.toBeVisible();
    });
  });
});
