export const BT_STRATEGY_ENDPOINTS = {
  ADD_BT_STRATEGY: { method: 'POST', url: '/v1/backtesting-strategies' },
  EXECUTE_BT_STRATEGY: { method: 'POST', url: '/v1/backtesting-strategies/:id/execute' },
  GET_BT_PROGRESS: { method: 'GET', url: '/v1/backtesting-strategies/:id/execution/:executionId/progress' },
  GET_BT_RESULT: { method: 'GET', url: '/v1/backtesting-strategies/:id/execution/:executionId/result' },
} as const;
