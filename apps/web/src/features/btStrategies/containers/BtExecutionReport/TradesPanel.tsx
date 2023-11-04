import Typography from '@mui/material/Typography';
import { formatInTimeZone } from 'date-fns-tz';
import { MRT_Cell, MRT_ColumnDef, MRT_Row, MaterialReactTable } from 'material-react-table';
import { useContext, useMemo } from 'react';

import DateCell from '#components/DateCell';
import { FilledEntryOrder, FilledExitOrder } from '#features/btStrategies/order';
import {
  ClosedTrade,
  TradesLists,
  calculatePercentageOfMaxDrawdown,
  calculatePercentageOfMaxRunup,
  calculatePercentageOfNetReturn,
} from '#features/btStrategies/trade';
import { BaseAsset, QuoteAsset } from '#features/symbols/symbol';
import { InfraContext } from '#infra/InfraProvider.context';
import { toDigits } from '#shared/utils/number';

export type TradesPanelProps = { trades: TradesLists; capitalCurrency: BaseAsset | QuoteAsset };

export default function TradesPanel({ trades, capitalCurrency }: TradesPanelProps) {
  const columns = useMemo<MRT_ColumnDef<ClosedTrade>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'entryOrder.filledAt',
        id: 'enteredAt',
        header: 'Entered at',
        Cell: ({ cell }) => <DateCell cell={cell} />,
      },
      { accessorKey: 'entryOrder.filledPrice', header: 'Entered price' },
      {
        accessorKey: 'exitOrder.filledAt',
        header: 'Exited at',
        Cell: ({ cell }) => <DateCell cell={cell} />,
      },
      { accessorKey: 'exitOrder.filledPrice', header: 'Exited price' },
      { accessorKey: 'tradeQuantity', header: 'Quantity' },
      {
        accessorKey: 'netReturn',
        header: `Net return (${capitalCurrency})`,
        Cell: ({ cell, row }) => <NetReturnCell cell={cell} row={row} />,
      },
      {
        accessorKey: 'maxRunup',
        header: `Max. run-up (${capitalCurrency})`,
        Cell: ({ cell, row }) => <MaxRunupCell cell={cell} row={row} />,
      },
      {
        accessorKey: 'maxDrawdown',
        header: `Max. drawdown (${capitalCurrency})`,
        Cell: ({ cell, row }) => <MaxDrawdownCell cell={cell} row={row} />,
      },
    ],
    [capitalCurrency],
  );

  return (
    <MaterialReactTable
      data={trades.closedTrades as ClosedTrade[]}
      columns={columns}
      state={{ sorting: [{ id: 'enteredAt', desc: false }] }}
      enableColumnResizing
      enableStickyHeader
      renderDetailPanel={({ row }) => <DetailPanel row={row} />}
      muiTableHeadCellProps={{
        sx: { '& .Mui-TableHeadCell-Content-Wrapper': { whiteSpace: 'break-spaces' } },
      }}
      muiTableContainerProps={{
        className:
          'dark:scrollbar-track-gray-500/25 dark:scrollbar-thin scrollbar dark:scrollbar-thumb-gray-600',
      }}
    />
  );
}

function NetReturnCell({ cell, row }: { cell: MRT_Cell<ClosedTrade>; row: MRT_Row<ClosedTrade> }) {
  return (
    <span className={`flex text-right ${pickColorForProfitOrLoss(cell.getValue<number>())}`}>
      {toDigits(cell.getValue<number>(), 4)}
      <br />
      {calculatePercentageOfNetReturn(row.original)}%
    </span>
  );
}
function MaxRunupCell({ cell, row }: { cell: MRT_Cell<ClosedTrade>; row: MRT_Row<ClosedTrade> }) {
  return (
    <span className={`flex text-right ${pickColorForProfitOrLoss(cell.getValue<number>())}`}>
      {toDigits(cell.getValue<number>(), 4)}
      <br />
      {calculatePercentageOfMaxRunup(row.original)}%
    </span>
  );
}
function MaxDrawdownCell({ cell, row }: { cell: MRT_Cell<ClosedTrade>; row: MRT_Row<ClosedTrade> }) {
  return (
    <span className={`flex text-right ${pickColorForProfitOrLoss(cell.getValue<number>())}`}>
      {toDigits(cell.getValue<number>(), 4)}
      <br />
      {calculatePercentageOfMaxDrawdown(row.original)}%
    </span>
  );
}

function pickColorForProfitOrLoss(val: number): string {
  return val > 0 ? 'text-success' : val < 0 ? 'text-error' : '';
}

function DetailPanel({ row }: { row: MRT_Row<ClosedTrade> }) {
  return (
    <div className="flex flex-1 px-6">
      <div className="flex-grow">
        <Typography className="font-bold underline">Entry order</Typography>
        <OrderDetails order={row.original.entryOrder} />
      </div>
      <div className="flex-grow">
        <Typography className="font-bold underline">Exit order</Typography>
        <OrderDetails order={row.original.exitOrder} />
      </div>
    </div>
  );
}
function OrderDetails({ order }: { order: FilledEntryOrder | FilledExitOrder }) {
  const { dateService } = useContext(InfraContext);
  const timezone = dateService.getTimezone();
  const dateFormat = 'yyyy-MM-dd HH:mm:ss';

  return (
    <div className="inline-grid grid-cols-2">
      <Typography>Order ID</Typography>
      <Typography>{order.id}</Typography>
      <Typography>Order type</Typography>
      <Typography>{order.type}</Typography>
      <Typography>Quantity</Typography>
      <Typography>{order.quantity}</Typography>
      {'limitPrice' in order ? (
        <>
          <Typography>Limit price</Typography>
          <Typography>{order.limitPrice}</Typography>
        </>
      ) : undefined}
      {'stopPrice' in order ? (
        <>
          <Typography>Stop price</Typography>
          <Typography>{order.stopPrice}</Typography>
        </>
      ) : undefined}
      <Typography>Filled price</Typography>
      <Typography>{order.filledPrice}</Typography>
      <Typography>Fee</Typography>
      <Typography>
        {order.fee.amount} {order.fee.currency}
      </Typography>
      <Typography>Created at</Typography>
      <Typography>{formatInTimeZone(order.createdAt, timezone, dateFormat)}</Typography>
      <Typography>Submitted at</Typography>
      <Typography>{formatInTimeZone(order.submittedAt, timezone, dateFormat)}</Typography>
      <Typography>Filled at</Typography>
      <Typography>{formatInTimeZone(order.filledAt, timezone, dateFormat)}</Typography>
    </div>
  );
}
