import * as te from 'fp-ts/lib/TaskEither';

import { SymbolRepo } from '#features/symbols/symbol.repository';
import { generateArrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/features/symbols/symbol';
import { mockForMonaco, revertMockForMonaco } from '#test-utils/monaco';
import { renderWithContexts } from '#test-utils/render';
import { byRole } from '#test-utils/uiSelector';

import BacktestStrategyPage from './BacktestStrategyPage';

function renderBacktestStrategyPage(overrides: { symbolRepo: SymbolRepo }) {
  return renderWithContexts(<BacktestStrategyPage />, ['Infra', 'ServerState', 'Date'], {
    infraContext: overrides,
  });
}
function renderBacktestStrategyPageSuccess() {
  const symbols = generateArrayOf(mockSymbol, 4);
  const symbolRepo = { getSymbols: jest.fn(te.right(symbols)) };

  renderBacktestStrategyPage({ symbolRepo });

  return { symbolRepo, symbols };
}

const ui = {
  form: byRole('form', { name: /backtest strategy/i }),
};

beforeAll(() => mockForMonaco());
afterEach(() => revertMockForMonaco());

describe('WHEN render', () => {
  it('THEN it should display a backtest strategy form', async () => {
    renderBacktestStrategyPageSuccess();

    const form = await ui.form.find();
    expect(form).toBeVisible();
  });
});
