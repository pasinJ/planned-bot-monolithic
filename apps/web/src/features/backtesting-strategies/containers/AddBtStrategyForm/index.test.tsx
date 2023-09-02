import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import * as te from 'fp-ts/lib/TaskEither';

import { BtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy.type';
import { SymbolRepo } from '#features/symbols/repositories/symbol.type';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { mockBtStrategyRepo } from '#test-utils/features/backtesting-strategies/repositories';
import { mockSymbolRepo } from '#test-utils/features/symbols/repositories';
import { mockSymbol } from '#test-utils/features/symbols/valueObjects';
import { renderWithContexts } from '#test-utils/render';
import { selectOption } from '#test-utils/uiEvents';
import { byLabelText, byRole } from '#test-utils/uiSelector';

import AddBtStrategyForm from '.';
import { timeframeOptions } from './constants';

function renderForm(overrides: { symbolRepo: Partial<SymbolRepo>; btStrategyRepo: Partial<BtStrategyRepo> }) {
  return renderWithContexts(<AddBtStrategyForm />, ['Infra', 'ServerState', 'Date'], {
    infraContext: {
      symbolRepo: mockSymbolRepo(overrides.symbolRepo),
      btStrategyRepo: mockBtStrategyRepo(overrides.btStrategyRepo),
    },
  });
}
function renderFormSuccess() {
  const symbols = generateArrayOf(mockSymbol, 4);
  const btStrategyRepo = { addBtStrategy: jest.fn().mockReturnValue(te.right(undefined)) };
  const symbolRepo = mockSymbolRepo({ getSymbols: jest.fn(te.right(symbols)) });
  renderForm({ btStrategyRepo, symbolRepo });

  return { btStrategyRepo, symbolRepo, symbols };
}
function formatDateForType(date: Date) {
  return format(date, 'MM/dd/yyyy HH:mm');
}

const currencyLabel = /base currency/i;
const timeframeLabel = /timeframe/i;
const ui = {
  form: byRole('form', { name: /add backtesting strategy/i }),
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
  submitButton: byRole('button', { name: /submit add backtesting strategy/i }),
};

describe('WHEN render', () => {
  it('THEN it should try to get symbols for symbol select input', () => {
    const { symbolRepo } = renderFormSuccess();
    expect(symbolRepo.getSymbols).toHaveBeenCalledOnce();
  });
  it('THEN it should display a add backtesting strategy form', async () => {
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
  it('THEN it should send add request with form value', async () => {
    const user = userEvent.setup();
    const { btStrategyRepo, symbols } = renderFormSuccess();

    const selectedSymbol = faker.helpers.arrayElement(symbols);
    const strategy = mockBtStrategy({
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

    expect(btStrategyRepo.addBtStrategy).toHaveBeenCalled();
  }, 30000);
});
