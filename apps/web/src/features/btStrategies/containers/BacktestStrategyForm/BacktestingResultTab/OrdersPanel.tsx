import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { MRT_ColumnDef, MRT_ColumnFiltersState, MRT_TableInstance } from 'material-react-table';
import { equals, flatten, pick, toPairs, values } from 'ramda';
import { useState } from 'react';
import { NonEmptyArray } from 'ts-essentials';

import DateCell from '#components/DateCell';
import MaterialReactTableWithRef from '#components/MaterialReactTableRef';
import MaterialSymbol from '#components/MaterialSymbol';
import TechnicalChart from '#containers/TechnicalChart';
import { Order, OrdersLists, orderStatusEnum } from '#features/btStrategies/order';
import { Kline } from '#features/klines/kline';
import { KeysOfUnion } from '#shared/common.type';

const columnDefs: Record<KeysOfUnion<Order>, MRT_ColumnDef<Order>> = {
  id: { accessorKey: 'id', header: 'ID' },
  type: { accessorKey: 'type', header: 'Order type' },
  orderSide: { accessorKey: 'orderSide', header: 'Order side' },
  status: { accessorKey: 'status', header: 'Status' },
  quantity: { accessorKey: 'quantity', header: 'Quantity' },
  limitPrice: { accessorKey: 'limitPrice', header: 'Limit price' },
  stopPrice: { accessorKey: 'stopPrice', header: 'Stop price' },
  filledPrice: { accessorKey: 'filledPrice', header: 'Filled price' },
  fee: {
    id: 'fee',
    header: 'Fee',
    accessorFn: (row) => ('fee' in row ? `${row.fee.amount} ${row.fee.currency}` : undefined),
  },
  reason: { accessorKey: 'reason', header: 'Reason' },
  orderIdToCancel: { accessorKey: 'orderIdToCancel', header: 'Order ID to cancel' },
  createdAt: { accessorKey: 'createdAt', header: 'Created at', Cell: ({ cell }) => <DateCell cell={cell} /> },
  submittedAt: {
    accessorKey: 'submittedAt',
    header: 'Submitted at',
    Cell: ({ cell }) => <DateCell cell={cell} />,
  },
  filledAt: { accessorKey: 'filledAt', header: 'Filled at', Cell: ({ cell }) => <DateCell cell={cell} /> },
  canceledAt: {
    accessorKey: 'canceledAt',
    header: 'Canceled at',
    Cell: ({ cell }) => <DateCell cell={cell} />,
  },
};

const submittedColumns: NonEmptyArray<KeysOfUnion<Order>> = [
  'id',
  'type',
  'status',
  'orderIdToCancel',
  'createdAt',
  'submittedAt',
  'filledAt',
];
const openingAndTriggeredColumns: NonEmptyArray<KeysOfUnion<Order>> = [
  'id',
  'type',
  'orderSide',
  'status',
  'quantity',
  'limitPrice',
  'stopPrice',
  'createdAt',
  'submittedAt',
];
const filledColumns: NonEmptyArray<KeysOfUnion<Order>> = [
  'id',
  'type',
  'orderSide',
  'status',
  'quantity',
  'limitPrice',
  'stopPrice',
  'filledPrice',
  'fee',
  'createdAt',
  'submittedAt',
  'filledAt',
];
const canceledColumns: NonEmptyArray<KeysOfUnion<Order>> = [
  'id',
  'type',
  'orderSide',
  'status',
  'quantity',
  'limitPrice',
  'stopPrice',
  'reason',
  'createdAt',
  'submittedAt',
  'canceledAt',
];
const rejectedColumns: NonEmptyArray<KeysOfUnion<Order>> = [
  'id',
  'type',
  'orderSide',
  'status',
  'quantity',
  'limitPrice',
  'stopPrice',
  'createdAt',
  'submittedAt',
];

const submittedFilter: MRT_ColumnFiltersState = [{ id: 'status', value: orderStatusEnum.SUBMITTED }];
const openingFilter: MRT_ColumnFiltersState = [{ id: 'status', value: orderStatusEnum.OPENING }];
const triggeredFilter: MRT_ColumnFiltersState = [{ id: 'status', value: orderStatusEnum.TRIGGERED }];
const filledFilter: MRT_ColumnFiltersState = [{ id: 'status', value: orderStatusEnum.FILLED }];
const canceledFilter: MRT_ColumnFiltersState = [{ id: 'status', value: orderStatusEnum.CANCELED }];
const rejectedFilter: MRT_ColumnFiltersState = [{ id: 'status', value: orderStatusEnum.REJECTED }];

type DisplayPreset = typeof displayPreset;
const displayPreset = {
  all: { label: 'All', columns: values(columnDefs), filter: undefined },
  submitted: {
    label: 'Submitted',
    columns: values(pick(submittedColumns, columnDefs)),
    filter: submittedFilter,
  },
  opening: {
    label: 'Opening',
    columns: values(pick(openingAndTriggeredColumns, columnDefs)),
    filter: openingFilter,
  },
  triggered: {
    label: 'Triggered',
    columns: values(pick(openingAndTriggeredColumns, columnDefs)),
    filter: triggeredFilter,
  },
  filled: {
    label: 'Filled',
    columns: values(pick(filledColumns, columnDefs)),
    filter: filledFilter,
  },
  canceled: {
    label: 'Canceled',
    columns: values(pick(canceledColumns, columnDefs)),
    filter: canceledFilter,
  },
  rejected: {
    label: 'Rejected',
    columns: values(pick(rejectedColumns, columnDefs)),
    filter: rejectedFilter,
  },
};

export type OrdersPanelProps = { orders: OrdersLists; klines: readonly Kline[] };

export default function OrdersPanel({ orders, klines }: OrdersPanelProps) {
  const [activeDisplayPreset, setActiveDisplayPreset] = useState<keyof DisplayPreset>('filled');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(flatten(values(orders)));

  const handleTableRefChange = (ref: MRT_TableInstance<Order> | null) => {
    if (ref !== null) {
      const newFilteredOrders = ref.getFilteredRowModel().rows.map((row) => row.original);
      setFilteredOrders((prev) => (equals(prev, newFilteredOrders) ? prev : newFilteredOrders));
    }
  };

  return (
    <div className="flex flex-col">
      <Accordion>
        <AccordionSummary className="font-medium" expandIcon={<MaterialSymbol symbol="expand_more" />}>
          Technical chart
        </AccordionSummary>
        <AccordionDetails>
          <TechnicalChart klines={klines} orders={filteredOrders} />
        </AccordionDetails>
      </Accordion>
      <Divider />
      <MaterialReactTableWithRef
        ref={handleTableRefChange}
        data={flatten(values(orders))}
        columns={displayPreset[activeDisplayPreset].columns}
        state={{ columnFilters: displayPreset[activeDisplayPreset].filter }}
        enableColumnResizing
        enableStickyHeader
        renderTopToolbarCustomActions={() => (
          <div className="flex flex-wrap gap-2 px-4">
            {toPairs(displayPreset).map(([key, val]) => (
              <Chip
                key={key}
                label={val.label}
                onClick={() => setActiveDisplayPreset(key)}
                variant={activeDisplayPreset === key ? 'filled' : 'outlined'}
                color="secondary"
              />
            ))}
          </div>
        )}
      />
    </div>
  );
}
