import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';

import MaterialSymbol from '#components/MaterialSymbol';
import PendingFetch from '#components/PendingFetch';
import { BtExecutionId } from '#features/btStrategies/btExecution';
import { BtRange, BtStrategyId, MaxNumKlines, extendBtRange } from '#features/btStrategies/btStrategy';
import BtExecutionReport from '#features/btStrategies/containers/BtExecutionReport';
import useBtStrategy from '#features/btStrategies/hooks/useBtStrategy';
import { ExchangeName } from '#features/exchanges/exchange';
import useKlines, { UseKlinesRequest } from '#features/klines/hooks/useKlines';
import { Timeframe } from '#features/klines/kline';
import { SymbolName } from '#features/symbols/symbol';
import useAutoFetch from '#hooks/useAutoFetch';
import { BacktestStrategyPageLink } from '#routes/components/pageLinks';
import { isUndefined } from '#shared/utils/typeGuards';

export default function BacktestReportPage() {
  const params = useParams();
  const { btStrategyId, btExecutionId } = params as {
    btStrategyId: BtStrategyId | undefined;
    btExecutionId: BtExecutionId | undefined;
  };

  const [fetchBtStrategy, handleRetryFetchBtStrategy] = useAutoFetch(
    !isUndefined(btStrategyId),
    useBtStrategy,
    [btStrategyId],
  );
  const [fetchKlines, handleRetryFetchKlines] = useAutoFetch(true, useKlines, [
    fetchBtStrategy.data ? createGetKlinesRequest(fetchBtStrategy.data) : null,
  ]);

  if (isUndefined(btStrategyId) || isUndefined(btExecutionId)) {
    return <>Error</>;
  } else if (isUndefined(fetchBtStrategy.data) || isUndefined(fetchKlines.data)) {
    return (
      <>
        <PendingFetch
          isLoading={fetchBtStrategy.isLoading}
          error={fetchBtStrategy.error}
          retryFetch={handleRetryFetchBtStrategy}
        />
        <PendingFetch
          isLoading={fetchKlines.isLoading}
          error={fetchKlines.error}
          retryFetch={handleRetryFetchKlines}
        />
      </>
    );
  } else {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between">
          <Typography variant="h4" component="h1" className="font-medium">
            Execution report
          </Typography>
          <Button
            className="h-fit rounded-2xl py-3"
            variant="contained"
            color="primary"
            size="large"
            component={BacktestStrategyPageLink(btStrategyId)}
            endIcon={<MaterialSymbol symbol="edit" />}
          >
            Edit
          </Button>
        </header>
        <Divider className="my-4" />
        <div className="flex justify-between px-6">
          <div className="flex gap-x-2">
            <Typography className="font-medium">Name: </Typography>
            <Typography>{fetchBtStrategy.data.name}</Typography>
          </div>
          <div className="flex gap-x-2">
            <Typography className="font-medium">Exchange: </Typography>
            <Typography>{fetchBtStrategy.data.exchange}</Typography>
          </div>
          <div className="flex gap-x-2">
            <Typography className="font-medium">Symbol: </Typography>
            <Typography>{fetchBtStrategy.data.symbol}</Typography>
          </div>
          <div className="flex gap-x-2">
            <Typography className="font-medium">Timeframe: </Typography>
            <Typography>{fetchBtStrategy.data.timeframe}</Typography>
          </div>
        </div>
        <Divider className="mt-4" />
        <div className="flex-grow">
          <BtExecutionReport
            btExecutionId={btExecutionId}
            initialCapital={fetchBtStrategy.data.initialCapital}
            capitalCurrency={fetchBtStrategy.data.capitalCurrency}
            assetCurrency={fetchBtStrategy.data.assetCurrency}
            btRange={fetchBtStrategy.data.btRange}
            klines={fetchKlines.data}
          />
        </div>
      </div>
    );
  }
}

function createGetKlinesRequest(data: {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxNumKlines: MaxNumKlines;
  btRange: BtRange;
}): UseKlinesRequest {
  const extendedRange = extendBtRange(data.btRange, data.timeframe, data.maxNumKlines);
  return {
    exchange: data.exchange,
    symbol: data.symbol,
    timeframe: data.timeframe,
    startTimestamp: extendedRange.start,
    endTimestamp: extendedRange.end,
  };
}
