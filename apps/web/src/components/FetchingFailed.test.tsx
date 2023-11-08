import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { constVoid } from 'fp-ts/lib/function';
import { MouseEventHandler } from 'react';

import { AppError } from '#shared/errors/appError';
import { createGeneralError } from '#shared/errors/generalError';
import { byRole, byText } from '#test-utils/uiSelector';

import FetchingFailed from './FetchingFailed';

function renderComponent(error: AppError | null, onRetry: MouseEventHandler) {
  return render(<FetchingFailed error={error} onRetry={onRetry} />);
}

const ui = {
  fetchingFailedMsg: byText(/failed to fetch data from server. please try again./i),
  retryButton: byRole('button', { name: /retry fetching data/i }),
};

describe('GIVEN fetching was failed WHEN render', () => {
  const error = createGeneralError('Error', 'Mock');

  it('THEN it should display an informative message and retry button', async () => {
    renderComponent(error, constVoid);

    await expect(ui.fetchingFailedMsg.find()).resolves.toBeVisible();
    await expect(ui.retryButton.find()).resolves.toBeVisible();
  });
  describe('WHEN click on the retry button', () => {
    it('THEN it should call onRetry function', async () => {
      const onRetry = jest.fn();
      renderComponent(error, onRetry);

      const retryButton = await ui.retryButton.find();
      const user = userEvent.setup();
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledOnce();
    });
  });
});

describe('GIVEN fetching was not failed WHEN render', () => {
  it('THEN it should not display an informative message and retry button', () => {
    renderComponent(null, constVoid);

    expect(ui.fetchingFailedMsg.query()).not.toBeInTheDocument();
    expect(ui.retryButton.query()).not.toBeInTheDocument();
  });
});
