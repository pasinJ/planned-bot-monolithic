import { screen } from '@testing-library/react';

import { renderWithContexts } from '#test-utils/render';

import BacktestingPage from './BacktestingPage';

function renderBacktestingPage() {
  return renderWithContexts(<BacktestingPage />, []);
}

describe('WHEN render', () => {
  it('THEN it should display page header', async () => {
    renderBacktestingPage();

    const header = await screen.findByRole('heading', { level: 1, name: /backtesting/i });
    expect(header).toBeVisible();
  });
});
