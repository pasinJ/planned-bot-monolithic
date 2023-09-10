import * as te from 'fp-ts/lib/TaskEither';

import { SymbolRepo } from '#features/symbols/repositories/symbol.type';
import { generateArrayOf } from '#test-utils/faker';
import { mockSymbolRepo } from '#test-utils/features/symbols/repositories';
import { mockSymbol } from '#test-utils/features/symbols/valueObjects';
import { mockForMonaco, revertMockForMonaco } from '#test-utils/monaco';
import { renderWithContexts } from '#test-utils/render';
import { byRole } from '#test-utils/uiSelector';

import AddBtStrategyPage from './AddBtStrategyPage';

function renderAddBtStrategyPage(overrides: { symbolRepo: SymbolRepo }) {
  return renderWithContexts(<AddBtStrategyPage />, ['Infra', 'ServerState', 'Date'], {
    infraContext: overrides,
  });
}
function renderAddBtStrategyPageSuccess() {
  const symbols = generateArrayOf(mockSymbol, 4);
  const symbolRepo = mockSymbolRepo({ getSymbols: jest.fn(te.right(symbols)) });

  renderAddBtStrategyPage({ symbolRepo });

  return { symbolRepo, symbols };
}

const ui = {
  form: byRole('form', { name: /add backtesting strategy/i }),
};

beforeAll(() => mockForMonaco());
afterEach(() => revertMockForMonaco());

describe('WHEN render', () => {
  it('THEN it should display a add backtesting strategy form', async () => {
    renderAddBtStrategyPageSuccess();

    const form = await ui.form.find();
    expect(form).toBeVisible();
  });
});
