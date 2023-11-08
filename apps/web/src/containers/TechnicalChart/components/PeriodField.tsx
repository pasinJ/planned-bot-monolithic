import { Control } from 'react-hook-form';

import IntegerFieldRf from '#components/IntegerFieldRf';
import { IntegerString } from '#shared/utils/string';

export default function PeriodField<T extends { period: IntegerString }>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <IntegerFieldRf
      controllerProps={{
        control: control as unknown as Control<{ period: IntegerString }>,
        name: 'period',
        rules: { required: 'Period is required' },
      }}
      fieldProps={{ id: 'period', label: 'Period', required: true }}
    />
  );
}
