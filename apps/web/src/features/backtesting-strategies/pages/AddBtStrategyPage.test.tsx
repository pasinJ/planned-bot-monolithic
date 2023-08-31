import * as te from 'fp-ts/lib/TaskEither';

import { HttpClient } from '#infra/httpClient.type';
import { arrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/mockValueObject';
import { renderWithContexts } from '#test-utils/render';
import { byRole } from '#test-utils/selector';

import AddBtStrategyPage from './AddBtStrategyPage';

function renderAddBtStrategyPage(overrides?: { httpClient: HttpClient }) {
  return renderWithContexts(
    <AddBtStrategyPage />,
    ['Infra', 'ServerState', 'Date'],
    overrides
      ? { infraContext: { httpClient: overrides.httpClient } }
      : { infraContext: { httpClient: { sendRequest: jest.fn().mockReturnValueOnce(te.right(undefined)) } } },
  );
}
function renderAddBtStrategyPageSuccess() {
  const symbols = arrayOf(mockSymbol, 4);
  const httpClient = { sendRequest: jest.fn().mockReturnValueOnce(te.right(symbols)) };
  renderAddBtStrategyPage({ httpClient });

  return { httpClient, symbols };
}

const ui = {
  form: byRole('form', { name: /add backtesting strategy/i }),
};

describe('WHEN render', () => {
  it('THEN it should display a add backtesting strategy form', async () => {
    renderAddBtStrategyPageSuccess();

    const form = await ui.form.find();
    expect(form).toBeVisible();
  });
});
