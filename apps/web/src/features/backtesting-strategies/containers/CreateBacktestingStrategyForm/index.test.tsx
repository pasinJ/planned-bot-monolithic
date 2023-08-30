import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import * as te from 'fp-ts/lib/TaskEither';

import { API_ENDPOINTS as BACKTEST_API_ENDPOINT } from '#features/backtesting-strategies/repositories/backtestingStrategy.constant';
import { API_ENDPOINTS as SYMBOL_API_ENDPOINTS } from '#features/symbols/repositories/symbol.constant';
import { HttpClient } from '#infra/httpClient.type';
import { selectOption } from '#test-utils/events';
import { arrayOf } from '#test-utils/faker';
import { mockBacktestingStrategy } from '#test-utils/mockEntity';
import { mockSymbol } from '#test-utils/mockValueObject';
import { renderWithContexts } from '#test-utils/render';
import { byLabelText, byRole } from '#test-utils/selector';

import CreateBacktestingStrategyForm from '../CreateBacktestingStrategyForm';
import { timeframeOptions } from './constants';

const { GET_SYMBOLS } = SYMBOL_API_ENDPOINTS;
const { CREATE_BACKTESTING_STRATEGY } = BACKTEST_API_ENDPOINT;

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
function formatDateForType(date: Date) {
  return format(date, 'MM/dd/yyyy HH:mm');
}

const currencyLabel = /base currency/i;
const timeframeLabel = /timeframe/i;
const ui = {
  form: byRole('form', { name: /create backtesting strategy/i }),
  strategyNameField: byRole('textbox', { name: /strategy name/i }),
  exchangeField: byLabelText(/exchange/i, { selector: 'input' }),
  symbolField: byRole('combobox', { name: /symbol/i }),
  currencyField: byLabelText(currencyLabel, { selector: 'input' }),
  timeframeField: byLabelText(timeframeLabel, { selector: 'input' }),
  maxNumKlinesField: byRole('textbox', { name: /maximum number of candlesticks/i }),
  initialCapitalField: byRole('textbox', { name: /initial capital/i }),
  takerFeeRateField: byRole('textbox', { name: /taker fee rate/i }),
  makerFeeRateField: byRole('textbox', { name: /maker fee rate/i }),
  startTimestampField: byRole('textbox', { name: /start timestamp/i }),
  endTimestampField: byRole('textbox', { name: /end timestamp/i }),
  strategyBodyField: byLabelText(/strategy body/i),
  submitButton: byRole('button', { name: /submit/i }),
};

describe('WHEN render', () => {
  it('THEN it should try to get symbols for symbol select input', () => {
    const { httpClient } = renderFormSuccess();

    expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith(GET_SYMBOLS);
  });
  it('THEN it should display a create backtesting strategy form', async () => {
    renderFormSuccess();

    await expect(ui.form.find()).resolves.toBeVisible();
  });
  it('THEN it should display form component inside the form', async () => {
    renderFormSuccess();

    const form = await ui.form.find();
    expect(ui.strategyNameField.get(form)).toBeInTheDocument();
    expect(ui.exchangeField.get(form)).toBeInTheDocument();
    expect(ui.symbolField.get(form)).toBeInTheDocument();
    expect(ui.currencyField.get(form)).toBeInTheDocument();
    expect(ui.timeframeField.get(form)).toBeInTheDocument();
    expect(ui.maxNumKlinesField.get(form)).toBeInTheDocument();
    expect(ui.initialCapitalField.get(form)).toBeInTheDocument();
    expect(ui.takerFeeRateField.get(form)).toBeInTheDocument();
    expect(ui.makerFeeRateField.get(form)).toBeInTheDocument();
    expect(ui.startTimestampField.get(form)).toBeInTheDocument();
    expect(ui.endTimestampField.get(form)).toBeInTheDocument();
    expect(ui.strategyBodyField.get(form)).toBeInTheDocument();
    expect(ui.submitButton.get(form)).toBeInTheDocument();
  });
});

describe('WHEN fill the form and hit submit button', () => {
  it('THEN it should send create request with form value', async () => {
    const user = userEvent.setup();
    const { httpClient, symbols } = renderFormSuccess();
    httpClient.sendRequest.mockReset();

    const selectedSymbol = faker.helpers.arrayElement(symbols);
    const strategy = mockBacktestingStrategy({
      symbol: selectedSymbol.name,
      currency: selectedSymbol.baseAsset,
    });
    await user.type(ui.strategyNameField.get(), strategy.name);
    await user.type(ui.symbolField.get(), strategy.symbol);
    await user.keyboard('{arrowDown}{enter}');
    await selectOption(currencyLabel, strategy.currency, user);
    await selectOption(timeframeLabel, timeframeOptions[strategy.timeframe], user);
    await user.type(ui.maxNumKlinesField.get(), strategy.maxNumKlines.toString());
    await user.type(ui.initialCapitalField.get(), strategy.initialCapital.toString());
    await user.type(ui.takerFeeRateField.get(), strategy.takerFeeRate.toString());
    await user.type(ui.makerFeeRateField.get(), strategy.makerFeeRate.toString());
    await user.type(ui.startTimestampField.get(), formatDateForType(strategy.startTimestamp));
    await user.type(ui.endTimestampField.get(), formatDateForType(strategy.endTimestamp));
    await user.type(ui.strategyBodyField.get(), strategy.body);
    await user.click(ui.submitButton.get());

    expect(httpClient.sendRequest).toHaveBeenCalledWith(expect.objectContaining(CREATE_BACKTESTING_STRATEGY));
  }, 10000);
});
