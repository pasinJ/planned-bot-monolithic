import userEvent from '@testing-library/user-event';
import * as te from 'fp-ts/lib/TaskEither';

import { HttpClient } from '#infra/httpClient.type';
import { mockBacktestingStrategy } from '#test-utils/mockEntity';
import { renderWithContexts } from '#test-utils/render';
import { byRole, byText } from '#test-utils/selector';

import BacktestingPage from './BacktestingPage';

function renderBacktestingPage(overrides?: { httpClient: HttpClient }) {
  return renderWithContexts(
    <BacktestingPage />,
    ['Infra', 'ServerState', 'Routes'],
    overrides
      ? { infraContext: { httpClient: overrides.httpClient } }
      : { infraContext: { httpClient: { sendRequest: jest.fn().mockReturnValue(te.right([])) } } },
  );
}
function renderBacktestingPageWithNoStrategy() {
  const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([])) };
  renderBacktestingPage({ httpClient });

  return { httpClient };
}
function renderBacktestingPageWithStrategy() {
  const strategy = mockBacktestingStrategy();
  const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([strategy])) };
  renderBacktestingPage({ httpClient });

  return { strategy, httpClient };
}
function renderBacktestingPageWithFetchingError() {
  const httpClient = { sendRequest: jest.fn().mockReturnValue(te.left(new Error('Mock error'))) };
  renderBacktestingPage({ httpClient });

  return { httpClient };
}

const ui = {
  pageHeader: byRole('heading', { level: 1, name: /backtesting/i }),
  noStrategyMsg: byText(/you have no existing strategy./i),
  snipper: byRole('progressbar'),
  createStrategyButton: byRole('link', { name: /go to create backtesting strategy form/i }),
  fetchingFailedMsg: byText(/failed to fetch data from server. please try again./i),
  retryFetchingButton: byRole('button', { name: /retry fetching data/i }),
};

describe('WHEN render', () => {
  it('THEN it should display page header', async () => {
    renderBacktestingPageWithNoStrategy();

    await expect(ui.pageHeader.find()).resolves.toBeVisible();
  });
});

describe('WHEN backtesting strategy is loading', () => {
  it('THEN it should display snipper', async () => {
    renderBacktestingPageWithNoStrategy();

    await expect(ui.snipper.find()).resolves.toBeVisible();
  });
});

describe('GIVEN there is no existing backtesting strategy WHEN user visit backtesting page', () => {
  it('THEN it should display an informative message and a create strategy button', async () => {
    renderBacktestingPageWithNoStrategy();

    await expect(ui.noStrategyMsg.find()).resolves.toBeVisible();
    await expect(ui.createStrategyButton.find()).resolves.toBeVisible();
  });
});

describe('GIVEN there is some existing backtesting strategies WHEN user visit backtesting page', () => {
  it('THEN it should not display the informative message as there is no strategy', () => {
    renderBacktestingPageWithStrategy();

    expect(ui.noStrategyMsg.query()).not.toBeInTheDocument();
  });
});

describe('WHEN cannot fetch data from server until max attempts', () => {
  it('THEN it should display informative message and retry button', async () => {
    renderBacktestingPageWithFetchingError();

    await expect(ui.fetchingFailedMsg.find()).resolves.toBeVisible();
    await expect(ui.retryFetchingButton.find()).resolves.toBeVisible();
  });
  describe('WHEN click on the retry button', () => {
    it('THEN it should start refetching again', async () => {
      const { httpClient } = renderBacktestingPageWithFetchingError();

      const retryButton = await ui.retryFetchingButton.find();
      expect(httpClient.sendRequest).toHaveBeenCalledTimes(3);

      const user = userEvent.setup();
      await user.click(retryButton);
      expect(httpClient.sendRequest).toHaveBeenCalledTimes(4);
    });
  });
});
