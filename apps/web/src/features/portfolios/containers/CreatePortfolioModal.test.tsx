import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithContexts } from '#test-utils/render';

import CreatePortfolioModal from './CreatePortfolioModal';

function renderCreatePortfolioModal() {
  return renderWithContexts(<CreatePortfolioModal />, ['Infra', 'ServerState']);
}
function getOpenButton() {
  return screen.getByRole('button', { name: /open create portfolio form/i });
}
function getCloseButton() {
  return screen.getByRole('button', { name: /close create portfolio form/i });
}
function getHeading() {
  return screen.getByRole('heading', { name: /create portfolio/i });
}
function queryHeading() {
  return screen.queryByRole('heading', { name: /create portfolio/i });
}

describe('WHEN user click open button', () => {
  it('THEN it should open the modal', async () => {
    renderCreatePortfolioModal();

    expect(queryHeading()).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(getOpenButton());

    expect(getHeading()).toBeVisible();
  });
});

describe('WHEN user click close button', () => {
  it('THEN it should close the modal', async () => {
    renderCreatePortfolioModal();

    const user = userEvent.setup();
    await user.click(getOpenButton());

    expect(getHeading()).toBeVisible();

    await user.click(getCloseButton());

    await waitForElementToBeRemoved(() => queryHeading());
  });
});
