import { LG_SCREEN_BP, MD_SCREEN_BP } from '#styles/theme.constant';

describe('GIVEN user is using large screen device', () => {
  beforeEach(() => {
    cy.viewport(LG_SCREEN_BP, LG_SCREEN_BP * 1.2);
    cy.visit('/');
  });

  describe('WHEN user clicks on backtesting page link in navigation bar', () => {
    it('THEN it should navigate to backtesting page', () => {
      cy.findByRole('navigation')
        .findByRole('link', { name: /backtesting/i })
        .click();

      cy.findByRole('heading', { name: /backtesting/i });
    });
  });
});

describe('GIVEN user is using other than large screen device', () => {
  beforeEach(() => {
    cy.viewport(MD_SCREEN_BP, MD_SCREEN_BP * 1.2);
    cy.visit('/');
  });

  describe('WHEN user clicks on backtesting page link in navigation bar', () => {
    it('THEN it should navigate to backtesting page', () => {
      cy.findByRole('button', { name: /open navigation drawer/i }).click();

      cy.findByRole('navigation')
        .findByRole('link', { name: /backtesting/i })
        .click();

      cy.findByRole('heading', { name: /backtesting/i });
    });
  });
});
