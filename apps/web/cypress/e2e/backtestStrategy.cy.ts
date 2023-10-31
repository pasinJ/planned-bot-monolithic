import { API_ENDPOINTS as BT_APIS } from '#features/btStrategies/endpoints';
import { API_ENDPOINTS as KLINES_APIS } from '#features/klines/endpoints';
import { Kline } from '#features/klines/kline';
import { API_ENDPOINTS as SYMBOL_APIS } from '#features/symbols/endpoints';
import { Symbol } from '#features/symbols/symbol';
import { BT_MAIN_ROUTE } from '#routes/routes.constant';
import { mockKline } from '#test-utils/features/klines/kline';
import { mockSymbol } from '#test-utils/features/symbols/symbol';

function interceptGetBtStrategies() {
  const { method, url } = BT_APIS.GET_BT_STRATEGIES;
  return cy.intercept(method, url, { statusCode: 200, body: [] });
}
function interceptGetSymbols(body?: Symbol[]) {
  const { method, url } = SYMBOL_APIS.GET_SYMBOLS;
  return cy.intercept(method, url, { statusCode: 200, body });
}
function interceptGetKlines(body?: Kline[]) {
  const { method, url } = KLINES_APIS.GET_KLINES;
  return cy.intercept(method, url.concat('*'), { statusCode: 200, body });
}
function interceptAddBtStrategy() {
  const { method, url } = BT_APIS.ADD_BT_STRATEGY;
  return cy
    .intercept(method, url, { statusCode: 201, body: { id: 'PnU65dncz4', createdAt: new Date() } })
    .as('addBtStrategy');
}
function interceptExecuteBtStrategy() {
  const { method, url } = BT_APIS.EXECUTE_BT_STRATEGY;
  return cy
    .intercept(method, url.replace(':btStrategyId', '*'), {
      statusCode: 202,
      body: { id: 'wYBG2cu1aU', btStrategyId: 'PnU65dncz4', createdAt: new Date() },
    })
    .as('executeBtStrategy');
}
function interceptExecutionProgress() {
  const { method, url } = BT_APIS.GET_EXECUTION_PROGRESS;
  return cy.intercept(method, url.replace(':btStrategyId', '*').replace(':btExecutionId', '*'), {
    statusCode: 200,
    body: { id: 'PnU65dncz4', btStrategyId: 'wYBG2cu1aU', status: 'FINISHED', percentage: 100, logs: [] },
  });
}
function interceptExecutionResult() {
  const { method, url } = BT_APIS.GET_EXECUTION_RESULT;
  return cy.intercept(method, url.replace(':btStrategyId', '*').replace(':btExecutionId', '*'), {
    statusCode: 200,
    fixture: 'execution-result',
  });
}

it('[WHEN] user create a new strategy for backtesting', () => {
  interceptGetBtStrategies();
  cy.visit(BT_MAIN_ROUTE);

  const symbol = mockSymbol();
  interceptGetSymbols([symbol]);
  cy.findByRole('link', { name: /create backtesting strategy page/i }).click();

  cy.findByRole('textbox', { name: /strategy name/i }).type(`New strategy`);
  cy.findByRole('combobox', { name: /symbol/i }).click();
  cy.findByRole('option', { name: symbol.name }).click();
  cy.findByRole('combobox', { name: /timeframe/i }).click();
  cy.findByRole('option', { name: /1 hour/i }).click();
  cy.findByRole('textbox', { name: /maximum number of candlesticks/i }).type(`{selectall}${200}`);
  cy.findByRole('textbox', { name: /start timestamp/i }).type(`10/10/2022 12:00`);
  cy.findByRole('textbox', { name: /end timestamp/i }).type(`10/10/2022 14:00`);

  interceptGetKlines([mockKline()]);
  cy.findByRole('button', { name: /next/i }).click();

  cy.findByRole('combobox', { name: /capital currency/i }).click();
  cy.findByRole('option', { name: symbol.quoteAsset }).click();
  cy.findByRole('textbox', { name: /initial capital/i }).type(`{selectall}${200}`);
  cy.findByRole('textbox', { name: /taker fee rate/i }).type(`{selectall}${0.1}`);
  cy.findByRole('textbox', { name: /maker fee rate/i }).type(`{selectall}${0.2}`);

  interceptAddBtStrategy();
  interceptExecuteBtStrategy();
  interceptExecutionProgress();
  interceptExecutionResult();
  cy.findByRole('button', { name: /save & execute/i }).click();

  cy.findByText('FINISHED');
  cy.findByRole('link', { name: /backtesting page/i }).click();
});
