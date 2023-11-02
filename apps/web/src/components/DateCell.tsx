import { formatInTimeZone } from 'date-fns-tz';
import { MRT_Cell } from 'material-react-table';
import { useContext } from 'react';
import { AnyRecord } from 'ts-essentials/dist/any-record';

import { InfraContext } from '#infra/InfraProvider.context';

export default function DateCell<T extends AnyRecord>({ cell }: { cell: MRT_Cell<T> }) {
  const { dateService } = useContext(InfraContext);
  const val = cell.getValue<Date | undefined>();

  return val ? formatInTimeZone(val, dateService.getTimezone(), 'yyyy-MM-dd HH:mm:ss') : undefined;
}
