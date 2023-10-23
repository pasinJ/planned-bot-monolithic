import userEvent from '@testing-library/user-event';
import * as te from 'fp-ts/lib/TaskEither';

import { BtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy';
import { mockHttpError } from '#test-utils/error';
import { generateArrayOf, randomString } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { mockBtStrategyRepo } from '#test-utils/features/backtesting-strategies/repositories';
import { renderWithContexts } from '#test-utils/render';
import { byRole, byText } from '#test-utils/uiSelector';

import { createBtStrategyRepoError } from '../features/backtesting-strategies/repositories/btStrategy.error';
import BtMainPage from './BtMainPage';

function renderBtMainPage(overrides: { btStrategyRepo: Partial<BtStrategyRepo> }) {
  return renderWithContexts(<BtMainPage />, ['Infra', 'ServerState', 'Routes'], {
    infraContext: { btStrategyRepo: mockBtStrategyRepo(overrides.btStrategyRepo) },
  });
}
function renderBtMainPageWithNoStrategy() {
  const btStrategyRepo = { getBtStrategies: jest.fn(te.right([])) };
  renderBtMainPage({ btStrategyRepo });

  return { btStrategyRepo };
}
function renderBtMainPageWithStrategy() {
  const strategies = generateArrayOf(mockBtStrategy);
  const btStrategyRepo = { getBtStrategies: jest.fn(te.right(strategies)) };
  renderBtMainPage({ btStrategyRepo });

  return { strategies, btStrategyRepo };
}
function renderBtMainPageWithFetchingError() {
  const error = createBtStrategyRepoError('GetStrategiesError', randomString(), mockHttpError());
  const btStrategyRepo = { getBtStrategies: jest.fn(te.left(error)) };
  renderBtMainPage({ btStrategyRepo });

  return { btStrategyRepo };
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
      const { btStrategyRepo } = renderBtMainPageWithFetchingError();

      const retryButton = await ui.retryFetchingButton.find();
      expect(btStrategyRepo.getBtStrategies).toHaveBeenCalledTimes(3);
      btStrategyRepo.getBtStrategies.mockClear();

      const user = userEvent.setup();
      await user.click(retryButton);
      expect(btStrategyRepo.getBtStrategies).toHaveBeenCalled();
    });
  });
});
