import { generateMock } from '@anatine/zod-mock';
import { faker } from '@faker-js/faker';

import { API_ENDPOINTS } from '#features/portfolios/repositories/portfolioRepository.constant';
import { DASHBOARD_ROUTE } from '#routes/routes.constant';

const { GET_PORTFOLIOS, CREATE_PORTFOLIO } = API_ENDPOINTS;

function interceptGetPortfolios(body: unknown[]) {
  const { method, url } = GET_PORTFOLIOS;
  return cy.intercept(method, url, { statusCode: 200, body }).as('getPortfolios');
}
function interceptCreatePortfolio(body: unknown = null) {
  const { method, url } = CREATE_PORTFOLIO;
  return cy.intercept(method, url, { statusCode: 201, body }).as('createPortfolio');
}

describe('GIVEN no portfolio has been created WHEN user visit Dashboard page', () => {
  it('THEN user have to create a portfolio first before continue', () => {
    interceptGetPortfolios([]);

    cy.visit(DASHBOARD_ROUTE);
    cy.wait('@getPortfolios');
    cy.findByText(/you do not have a portfolio. please create one to continue./i);
    cy.findByRole('button', { name: /open create portfolio form/i }).click();

    const createPortfolioResponse = generateMock(CREATE_PORTFOLIO.responseSchema);
    const getPortfolioResponse = generateMock(GET_PORTFOLIOS.responseSchema);
    interceptCreatePortfolio(createPortfolioResponse);
    interceptGetPortfolios(getPortfolioResponse);

    const initialCapital = faker.number.float({ min: 0, max: 1000, precision: 0.00000001 });
    const { takerFee, makerFee } = createPortfolioResponse;
    cy.findByRole('heading').findByText(/create portfolio/i);
    cy.findByRole('textbox', { name: /initial capital/i }).type(`{selectall}${initialCapital}`);
    cy.findByRole('textbox', { name: /taker trading fee/i }).type(`{selectall}${takerFee}`);
    cy.findByRole('textbox', { name: /maker trading fee/i }).type(`{selectall}${makerFee}`);
    cy.findByRole('button', { name: /submit create portfolio/i }).click();
    cy.wait('@createPortfolio');
    cy.findByText(/your portfolio has been successfully created./i);
    cy.findByRole('button', { name: /close create portfolio form/i }).click();

    cy.wait('@getPortfolios');
    cy.findByRole('heading', { name: /dashboard/i });
  });
});

describe('GIVEN the account already has some portfolios WHEN user visit Dashboard page', () => {
  it('THEN user can see the dashboard content', () => {
    const getPortfolioResponse = generateMock(GET_PORTFOLIOS.responseSchema);
    interceptGetPortfolios(getPortfolioResponse);

    cy.visit(DASHBOARD_ROUTE);
    cy.wait('@getPortfolios');
    cy.findByRole('heading', { name: /dashboard/i });
    cy.findByText(/you do not have a portfolio. please create one to continue./i).should('not.exist');
    cy.findByRole('button', { name: /open create portfolio form/i }).should('not.exist');
  });
});
