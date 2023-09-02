import { API_ENDPOINTS } from '#features/backtesting-strategies/repositories/btStrategy.constant';
import { BT_MAIN_ROUTE } from '#routes/routes.constant';

const { GET_BT_STRATEGIES } = API_ENDPOINTS;

function interceptGetBacktesting(body: unknown[]) {
  const { method, url } = GET_BT_STRATEGIES;
  return cy.intercept(method, url, { statusCode: 200, body }).as('getBacktestingStrategies');
}
// function interceptCreateBacktesting(body: unknown = null) {
//   const { method, url } = ADD_BT_STRATEGY;
//   return cy.intercept(method, url, { statusCode: 201, body }).as('createBacktestingStrategy');
// }

describe('GIVEN there is no existing backtesting strategy WHEN user visit backtesting page', () => {
  it('THEN user have to create a backtesting strategy first before continue', () => {
    interceptGetBacktesting([]);

    cy.visit(BT_MAIN_ROUTE);
    cy.wait('@getBacktestingStrategies');
    cy.findByText(/you have no existing strategy./i);
    cy.findByRole('link', { name: /go to add backtesting strategy page/i }).click();

    // const strategy = mockBtStrategy();
    // const getBacktestingStrategiesResponse = generateArrayOf(mockBtStrategy);
    // interceptCreateBacktesting(strategy);
    // interceptGetBacktesting(getBacktestingStrategiesResponse);

    // cy.findByRole('form', { name: /create backtesting strategy/i }).within(() => {
    //   const { name } = strategy;
    //   cy.findByRole('textbox', { name: /strategy name/i }).type(`{selectall}${name}`);
    //   cy.findByRole('textbox', { name: /exchange/i });
    //   cy.findByRole('sele', { name: /symbol/i }).type(`{selectall}${name}`);
    //   cy.findByRole('textbox', { name: /strategy name/i }).type(`{selectall}${name}`);
    // });

    // const initialCapital = faker.number.float({ min: 0, max: 1000, precision: 0.00000001 });
    // const { takerFee, makerFee } = createBacktestingStrategyResponse;
    // cy.findByRole('heading').findByText(/create portfolio/i);
    // cy.findByRole('textbox', { name: /initial capital/i }).type(`{selectall}${initialCapital}`);
    // cy.findByRole('textbox', { name: /taker trading fee/i }).type(`{selectall}${takerFee}`);
    // cy.findByRole('textbox', { name: /maker trading fee/i }).type(`{selectall}${makerFee}`);
    // cy.findByRole('button', { name: /submit create portfolio/i }).click();
    // cy.wait('@createPortfolio');
    // cy.findByText(/your portfolio has been successfully created./i);
    // cy.findByRole('button', { name: /close create portfolio form/i }).click();

    // cy.wait('@getBacktestingStrategies');
    // cy.findByRole('listitem', { name: new RegExp('') });
  });
});
