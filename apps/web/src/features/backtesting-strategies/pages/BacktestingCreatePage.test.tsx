import * as te from 'fp-ts/lib/TaskEither';

import { HttpClient } from '#infra/httpClient.type';
import { arrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/mockValueObject';
import { renderWithContexts } from '#test-utils/render';
import { byRole } from '#test-utils/selector';

import BacktestingCreatePage from './BacktestingCreatePage';

function renderBacktestingCreatePage(overrides?: { httpClient: HttpClient }) {
  return renderWithContexts(
    <BacktestingCreatePage />,
    ['Infra', 'ServerState', 'Date'],
    overrides
      ? { infraContext: { httpClient: overrides.httpClient } }
      : { infraContext: { httpClient: { sendRequest: jest.fn().mockReturnValueOnce(te.right(undefined)) } } },
  );
}
function renderBacktestingCreatePageSuccess() {
  const symbols = arrayOf(mockSymbol, 4);
  const httpClient = { sendRequest: jest.fn().mockReturnValueOnce(te.right(symbols)) };
  renderBacktestingCreatePage({ httpClient });

  return { httpClient, symbols };
}

const ui = {
  form: byRole('form', { name: /create backtesting strategy/i }),
};

describe('WHEN render', () => {
  it('THEN it should display a create backtesting strategy form', async () => {
    renderBacktestingCreatePageSuccess();

    const form = await ui.form.find();
    expect(form).toBeVisible();
  });
});
