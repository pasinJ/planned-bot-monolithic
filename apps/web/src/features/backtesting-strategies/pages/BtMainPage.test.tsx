import userEvent from '@testing-library/user-event';
import * as te from 'fp-ts/lib/TaskEither';

import { HttpClient } from '#infra/httpClient.type';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { renderWithContexts } from '#test-utils/render';
import { byRole, byText } from '#test-utils/uiSelector';

import BtMainPage from './BtMainPage';

function renderBtMainPage(overrides?: { httpClient: HttpClient }) {
  return renderWithContexts(
    <BtMainPage />,
    ['Infra', 'ServerState', 'Routes'],
    overrides
      ? { infraContext: { httpClient: overrides.httpClient } }
      : { infraContext: { httpClient: { sendRequest: jest.fn().mockReturnValue(te.right([])) } } },
  );
}
function renderBtMainPageWithNoStrategy() {
  const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([])) };
  renderBtMainPage({ httpClient });

  return { httpClient };
}
function renderBtMainPageWithStrategy() {
  const strategy = mockBtStrategy();
  const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([strategy])) };
  renderBtMainPage({ httpClient });

  return { strategy, httpClient };
}
function renderBtMainPageWithFetchingError() {
  const httpClient = { sendRequest: jest.fn().mockReturnValue(te.left(new Error('Mock error'))) };
  renderBtMainPage({ httpClient });

  return { httpClient };
}

const ui = {
  pageHeader: byRole('heading', { level: 1, name: /backtesting/i }),
  noStrategyMsg: byText(/you have no existing strategy./i),
  snipper: byRole('progressbar'),
  addStrategyButton: byRole('link', { name: /go to add backtesting strategy page/i }),
  fetchingFailedMsg: byText(/failed to fetch data from server. please try again./i),
  retryFetchingButton: byRole('button', { name: /retry fetching data/i }),
};

describe('WHEN render', () => {
  it('THEN it should display page header', async () => {
    renderBtMainPageWithNoStrategy();

    await expect(ui.pageHeader.find()).resolves.toBeVisible();
  });
});

describe('WHEN backtesting strategy is loading', () => {
  it('THEN it should display snipper', async () => {
    renderBtMainPageWithNoStrategy();

    await expect(ui.snipper.find()).resolves.toBeVisible();
  });
});

describe('GIVEN there is no existing backtesting strategy WHEN user visit backtesting page', () => {
  it('THEN it should display an informative message and a add strategy button', async () => {
    renderBtMainPageWithNoStrategy();

    await expect(ui.noStrategyMsg.find()).resolves.toBeVisible();
    await expect(ui.addStrategyButton.find()).resolves.toBeVisible();
  });
});

describe('GIVEN there is some existing backtesting strategies WHEN user visit backtesting page', () => {
  it('THEN it should not display the informative message as there is no strategy', () => {
    renderBtMainPageWithStrategy();

    expect(ui.noStrategyMsg.query()).not.toBeInTheDocument();
  });
});

describe('WHEN cannot fetch data from server until max attempts', () => {
  it('THEN it should display informative message and retry button', async () => {
    renderBtMainPageWithFetchingError();

    await expect(ui.fetchingFailedMsg.find()).resolves.toBeVisible();
    await expect(ui.retryFetchingButton.find()).resolves.toBeVisible();
  });
  describe('WHEN click on the retry button', () => {
    it('THEN it should start refetching again', async () => {
      const { httpClient } = renderBtMainPageWithFetchingError();

      const retryButton = await ui.retryFetchingButton.find();
      expect(httpClient.sendRequest).toHaveBeenCalledTimes(3);
      httpClient.sendRequest.mockClear();

      const user = userEvent.setup();
      await user.click(retryButton);
      expect(httpClient.sendRequest).toHaveBeenCalled();
    });
  });
});
