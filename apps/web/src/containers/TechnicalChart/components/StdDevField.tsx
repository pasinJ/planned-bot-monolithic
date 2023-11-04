import { Control } from 'react-hook-form';

import IntegerFieldRf from '#components/IntegerFieldRf';
import { IntegerString } from '#shared/utils/string';

export default function StdDevField<T extends { stddev: IntegerString }>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <IntegerFieldRf
      controllerProps={{
        control: control as unknown as Control<{ stddev: IntegerString }>,
        name: 'stddev',
        rules: { required: 'StdDev is required' },
      }}
      fieldProps={{ id: 'stddev', label: 'StdDev', required: true }}
    />
  );
}
