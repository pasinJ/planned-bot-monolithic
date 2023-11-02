import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { MRT_ColumnDef, MRT_Row, MRT_TableInstance } from 'material-react-table';
import { useMemo } from 'react';

import BnbLogo from '#assets/binance-logo.svg';
import DateCell from '#components/DateCell';
import MaterialReactTableRef from '#components/MaterialReactTableRef';
import MaterialSymbol from '#components/MaterialSymbol';
import PendingFetch from '#components/PendingFetch';
import { BtExecutionProgress } from '#features/btStrategies/btExecutionProgress';
import { BtStrategy, BtStrategyId } from '#features/btStrategies/btStrategy';
import useBtStrategies from '#features/btStrategies/hooks/useBtStrategies';
import useLastExecutionsProgress from '#features/btStrategies/hooks/useLastExecutionsProgress';
import { Timeframe } from '#features/klines/kline';
import useAutoFetch from '#hooks/useAutoFetch';
import useObjState from '#hooks/useObjState';
import { BacktestStrategyPageLink } from '#routes/components/pageLinks';
import { isUndefined } from '#shared/utils/typeGuards';

type X = {
  btStrategy: BtStrategy;
  lastExecutionProgress: BtExecutionProgress | null;
};

const timeframeMap: Record<Timeframe, string> = {
  '1s': '1 second',
  '1m': '1 minute',
  '3m': '3 minutes',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '4h': '4 hours',
  '6h': '6 hours',
  '8h': '8 hours',
  '12h': '12 hours',
  '1d': '1 day',
  '3d': '3 days',
  '1w': '1 week',
  '1M': '1 month',
};

const columnDefs: MRT_ColumnDef<X>[] = [
  { header: 'Name', accessorKey: 'btStrategy.name', minSize: 200 },
  {
    header: 'Exchange',
    accessorKey: 'btStrategy.exchange',
    Cell: () => <ExchangeCell />,
    size: 40,
  },
  { header: 'Symbol', accessorKey: 'btStrategy.symbol', size: 40 },
  {
    header: 'Timeframe',
    id: 'btStrategy.timeframe',
    accessorFn: ({ btStrategy: { timeframe } }) => timeframeMap[timeframe],
    size: 40,
  },
  { header: 'Status', id: 'status', Cell: ({ row }) => <StatusCell row={row} />, size: 40 },
  { header: 'Version', accessorKey: 'btStrategy.version', size: 40 },
  {
    header: 'Created at',
    accessorKey: 'btStrategy.createdAt',
    Cell: ({ cell }) => <DateCell cell={cell} />,
  },
  {
    header: 'Last updated at',
    accessorKey: 'btStrategy.updatedAt',
    Cell: ({ cell }) => <DateCell cell={cell} />,
  },
];

function StatusCell({ row }: { row: MRT_Row<X> }) {
  const status = row.original.lastExecutionProgress?.status;

  if (isUndefined(status)) {
    return '-';
  } else if (status === 'PENDING') {
    return <Chip label="Pending" />;
  } else if (status === 'RUNNING') {
    return <Chip label="Running" className="bg-emerald-100" icon={<CircularProgress size={18} />} />;
  } else if (status === 'FINISHED') {
    return <Chip label="Finished" color="success" icon={<MaterialSymbol symbol="done" />} />;
  } else if (status === 'FAILED') {
    return <Chip label="Failed" color="error" icon={<MaterialSymbol symbol="error" />} />;
  } else if (status === 'INTERUPTED') {
    return <Chip label="Interupted" color="error" icon={<MaterialSymbol symbol="error" />} />;
  } else if (status === 'TIMEOUT') {
    return (
      <Chip label="Timeout" color="warning" icon={<MaterialSymbol symbol="warning" className="mb-0.5" />} />
    );
  } else {
    return (
      <Chip label="Canceled" color="warning" icon={<MaterialSymbol symbol="warning" className="mb-0.5" />} />
    );
  }
}

function ExchangeCell() {
  return (
    <Chip
      className="w-24"
      label="Binance"
      icon={<img src={BnbLogo} alt="Binance" className="mb-0.5 py-1.5" />}
    />
  );
}

export default function BtStrategyTable() {
  const [fetchBtStrategies, handleRetryFetchBtStrategies] = useAutoFetch(true, useBtStrategies);

  const [filteredBtStrategyIds, setFilteredBtStrategyIds] = useObjState<BtStrategyId[]>([]);
  const lastExecutionsProgress = useLastExecutionsProgress(true, filteredBtStrategyIds);
  const handleTableRefChange = (ref: MRT_TableInstance<X> | null) => {
    if (ref !== null) {
      const newFilteredBtStrategyIds = ref
        .getFilteredRowModel()
        .rows.map((row) => row.original.btStrategy.id);

      setFilteredBtStrategyIds(newFilteredBtStrategyIds);
    }
  };

  const tableData = useMemo(
    () =>
      fetchBtStrategies.data?.map((btStrategy, index) => ({
        btStrategy,
        lastExecutionProgress: lastExecutionsProgress.at(index)?.data ?? null,
      })) ?? [],
    [fetchBtStrategies.data, lastExecutionsProgress],
  );

  return (
    <>
      <PendingFetch
        isLoading={fetchBtStrategies.isLoading}
        error={fetchBtStrategies.error}
        retryFetch={handleRetryFetchBtStrategies}
      />
      {fetchBtStrategies.isLoading ? undefined : (
        <MaterialReactTableRef
          ref={handleTableRefChange}
          columns={columnDefs}
          data={tableData}
          enableRowActions={true}
          enableDensityToggle={false}
          renderRowActions={RowAction}
          muiTableContainerProps={{ className: 'min-h-[30rem]' }}
          state={{ showProgressBars: fetchBtStrategies.isRefetching }}
        />
      )}
    </>
  );
}

function RowAction({ row }: { row: MRT_Row<X> }) {
  const btStrategyId = row.original.btStrategy.id;
  const lastExecutionStatus = row.original.lastExecutionProgress?.status;

  return (
    <div className="flex gap-x-1">
      <IconButton color="primary" className="bg-primary/5" component={BacktestStrategyPageLink(btStrategyId)}>
        <MaterialSymbol symbol="edit" />
      </IconButton>
      {lastExecutionStatus && lastExecutionStatus !== 'PENDING' ? (
        <IconButton
          color="primary"
          className="bg-primary/5"
          component={BacktestStrategyPageLink(btStrategyId)}
        >
          <MaterialSymbol symbol="monitoring" />
        </IconButton>
      ) : undefined}
    </div>
  );
}
