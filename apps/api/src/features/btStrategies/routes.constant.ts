export const BT_STRATEGY_ENDPOINTS = {
  GET_BT_STRATEGY: { method: 'GET', url: '/v1/backtesting-strategies/:btStrategyId' },
  ADD_BT_STRATEGY: { method: 'POST', url: '/v1/backtesting-strategies' },
  UPDATE_BT_STRATEGY: { method: 'PUT', url: '/v1/backtesting-strategies/:btStrategyId' },
  EXECUTE_BT_STRATEGY: { method: 'POST', url: '/v1/backtesting-strategies/:btStrategyId/execute' },
  GET_BT_PROGRESS: {
    method: 'GET',
    url: '/v1/backtesting-strategies/:btStrategyId/execution/:btExecutionId/progress',
  },
  GET_BT_RESULT: {
    method: 'GET',
    url: '/v1/backtesting-strategies/:btStrategyId/execution/:btExecutionId/result',
  },
  GET_LAST_EXECUTION_PROGRESS: {
    method: 'GET',
    url: '/v1/backtesting-strategies/:btStrategyId/lastExecution/progress',
  },
} as const;
