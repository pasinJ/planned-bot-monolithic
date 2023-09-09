import { format } from 'date-fns';

import { API_ENDPOINTS as BT_APIS } from '#features/backtesting-strategies/repositories/btStrategy.constant';
import { Symbol } from '#features/symbols/domain/symbol.valueObject';
import { API_ENDPOINTS as SYMBOL_APIS } from '#features/symbols/repositories/symbol.constant';
import { BT_MAIN_ROUTE } from '#routes/routes.constant';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { mockSymbol } from '#test-utils/features/symbols/valueObjects';

function interceptGetBtStrategies(body: unknown[]) {
  const { method, url } = BT_APIS.GET_BT_STRATEGIES;
  return cy.intercept(method, url, { statusCode: 200, body }).as('getBtStrategies');
}
function interceptGetSymbols(body?: Symbol[]) {
  const { method, url } = SYMBOL_APIS.GET_SYMBOLS;
  return cy.intercept(method, url, { statusCode: 200, body });
}
function interceptAddBtStrategy() {
  const { method, url } = BT_APIS.ADD_BT_STRATEGY;
  return cy.intercept(method, url, { statusCode: 201 }).as('addBtStrategy');
}

describe('GIVEN there is no existing backtesting strategy WHEN user visit backtesting page', () => {
  it('THEN user have to create a backtesting strategy first before continue', () => {
    const symbols = generateArrayOf(mockSymbol);
    const strategy = mockBtStrategy({ symbol: symbols.at(0)?.name, currency: symbols.at(0)?.baseAsset });

    interceptGetBtStrategies([]);
    interceptGetSymbols(symbols);

    cy.visit(BT_MAIN_ROUTE);
    cy.wait('@getBtStrategies');
    cy.findByText(/you have no existing strategy./i);
    cy.findByRole('link', { name: /go to add backtesting strategy page/i }).click();

    interceptAddBtStrategy();

    cy.findByRole('form', { name: /add backtesting strategy/i });
    cy.findByRole('textbox', { name: /strategy name/i }).type(`{selectall}${strategy.name}`);
    cy.findByLabelText(/symbol/i)
      .parent()
      .click();
    cy.get(`ul > li:contains("${strategy.symbol}")`).click();
    cy.findByRole('button', { name: /base currency/i }).click();
    cy.get(`ul > li[data-value="${strategy.currency}"]`).click();
    cy.findByRole('button', { name: /timeframe/i }).click();
    cy.get(`ul > li[data-value="${strategy.timeframe}"]`).click();
    cy.findByRole('textbox', { name: /maximum number of candlesticks/i }).type(
      `{selectall}${strategy.maxNumKlines}`,
    );
    cy.findByRole('textbox', { name: /initial capital/i }).type(`{selectall}${strategy.initialCapital}`);
    cy.findByRole('textbox', { name: /taker fee rate/i }).type(`{selectall}${strategy.takerFeeRate}`);
    cy.findByRole('textbox', { name: /maker fee rate/i }).type(`{selectall}${strategy.makerFeeRate}`);
    cy.findByRole('textbox', { name: /start timestamp/i }).type(
      `${format(strategy.startTimestamp, 'MM/dd/yyyy HH:mm')}`,
    );
    cy.findByRole('textbox', { name: /end timestamp/i }).type(
      `${format(strategy.endTimestamp, 'MM/dd/yyyy HH:mm')}`,
    );
    cy.findByRole('code').click();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.focused().type(strategy.body);
    cy.findByRole('button', { name: /submit add backtesting strategy/i }).click();
    cy.wait('@addBtStrategy');
  });
});
