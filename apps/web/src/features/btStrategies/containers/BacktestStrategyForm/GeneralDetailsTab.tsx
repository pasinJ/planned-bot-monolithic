import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { prop, toPairs } from 'ramda';
import { FormEventHandler } from 'react';
import { Control, UseFormProps } from 'react-hook-form';
import { z } from 'zod';

import AutocompleteFieldRf from '#components/AutocompleteFieldRf';
import DateTimePickerRf from '#components/DateTimePickerRf';
import IntegerFieldRf from '#components/IntegerFieldRf';
import SelectFieldRf from '#components/SelectFieldRf';
import TextFieldRf from '#components/TextFieldRf';
import {
  BtRange,
  BtStrategyName,
  MaxNumKlines,
  btRangeSchema,
  btStrategyNameSchema,
  maxNumKlinesSchema,
} from '#features/btStrategies/btStrategy';
import { ExchangeName, exchangeNameEnum, exchangeNameSchema } from '#features/exchanges/exchange';
import { Timeframe, timeframeSchema } from '#features/klines/kline';
import { Symbol, SymbolName, symbolNameSchema } from '#features/symbols/symbol';
import useFormZod from '#hooks/useFormZod';
import { ValidDate } from '#shared/utils/date';
import { IntegerString } from '#shared/utils/string';
import { schemaForType } from '#shared/utils/zod';

type GeneralDetailsFormControl = Control<GeneralDetailsFormValues>;

export type GeneralDetailsFormValues = {
  name: string;
  exchange: ExchangeName;
  symbol: SymbolName | null;
  timeframe: Timeframe | '';
  maxNumKlines: IntegerString;
  btRange: { start: ValidDate; end: ValidDate };
};
export type GeneralDetails = {
  name: BtStrategyName;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxNumKlines: MaxNumKlines;
  btRange: BtRange;
};
const generalDetailsSchema = schemaForType<GeneralDetails>().with(
  z.object({
    name: btStrategyNameSchema,
    exchange: exchangeNameSchema,
    symbol: z.string({ invalid_type_error: 'Symbol is require' }).pipe(symbolNameSchema),
    timeframe: z.string().min(1, 'Timeframe is require').pipe(timeframeSchema),
    maxNumKlines: z.coerce.number().pipe(maxNumKlinesSchema),
    btRange: btRangeSchema,
  }),
);

const generalDetailsFormOptions: Partial<UseFormProps<GeneralDetailsFormValues>> = {
  mode: 'all',
  resolver: zodResolver(generalDetailsSchema),
};

type GeneralDetailsTabProps = {
  formValues: GeneralDetailsFormValues;
  symbols: readonly Symbol[];
  startFetchKlines: (generalFormValues: GeneralDetails) => void;
  moveToNextTab: (formValues: GeneralDetailsFormValues, formValidValues: GeneralDetails) => void;
};
export default function GeneralDetailsTab(props: GeneralDetailsTabProps) {
  const { formValues, symbols, moveToNextTab, startFetchKlines } = props;

  const { control, handleSubmit, getValues } = useFormZod<GeneralDetailsFormValues, GeneralDetails>({
    ...generalDetailsFormOptions,
    defaultValues: formValues,
    values: formValues,
  });

  const onSubmit = handleSubmit((transformedFormValues) => {
    startFetchKlines(transformedFormValues);
    moveToNextTab(getValues(), transformedFormValues);
  }) as FormEventHandler<HTMLFormElement>;

  return (
    <form className="flex flex-col rounded-xl bg-background p-4 shadow-2 lg:mt-6 lg:p-8" onSubmit={onSubmit}>
      <StrategyNameField control={control} />
      <Divider textAlign="center" className="mb-4">
        Symbol information
      </Divider>
      <div className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
        <ExchangeField control={control} />
        <SymbolField control={control} symbols={symbols} />
      </div>
      <div className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
        <TimeframeField control={control} />
        <MaxNumKlinesField control={control} />
      </div>
      <Divider textAlign="center">Backtest period</Divider>
      <div className="mb-4 flex justify-center">
        <Typography variant="subtitle2" className="text-gray-500">
          (Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone})
        </Typography>
      </div>
      <div className="flex gap-x-6">
        <StartTimestampField control={control} />
        <EndTimestampField control={control} />
      </div>
      <Divider />
      <Button className="mt-4 self-end" variant="contained" type="submit">
        Next
      </Button>
    </form>
  );
}

function StrategyNameField({ control }: { control: GeneralDetailsFormControl }) {
  return (
    <TextFieldRf
      controllerProps={{ control, name: 'name' }}
      fieldProps={{ id: 'strategy-name-field', label: 'Strategy name', className: 'w-full', required: true }}
    />
  );
}
function ExchangeField({ control }: { control: GeneralDetailsFormControl }) {
  return (
    <SelectFieldRf
      controllerProps={{ name: 'exchange', control }}
      formControlProps={{ className: 'min-w-[8rem] flex-grow' }}
      selectProps={{
        id: 'exchange-field',
        label: 'Exchange',
        labelId: 'exchange-field-label',
        disabled: true,
      }}
    >
      <MenuItem value={exchangeNameEnum.BINANCE} selected>
        Binance
      </MenuItem>
    </SelectFieldRf>
  );
}
function SymbolField({
  control,
  symbols,
}: {
  control: GeneralDetailsFormControl;
  symbols: readonly Symbol[];
}) {
  return (
    <AutocompleteFieldRf
      controllerProps={{ control, name: 'symbol' }}
      autocompleteProps={{
        id: 'symbol-field',
        className: 'min-w-[10rem] flex-grow',
        options: symbols.map(prop('name')),
        autoComplete: true,
      }}
      fieldProps={{ label: 'Symbol', variant: 'outlined', required: true }}
    />
  );
}
const timeframeOptions: Record<Timeframe, string> = {
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
function TimeframeField({ control }: { control: GeneralDetailsFormControl }) {
  return (
    <SelectFieldRf
      controllerProps={{ control, name: 'timeframe' }}
      formControlProps={{ className: 'min-w-[10rem] flex-grow' }}
      selectProps={{
        id: 'timeframe-field',
        label: 'Timeframe',
        labelId: 'timeframe-field-label',
        MenuProps: { className: 'max-h-96' },
        required: true,
      }}
    >
      <MenuItem value="">None</MenuItem>
      {toPairs(timeframeOptions).map(([value, label], index) => (
        <MenuItem key={index} value={value}>
          {label}
        </MenuItem>
      ))}
    </SelectFieldRf>
  );
}
function MaxNumKlinesField({ control }: { control: GeneralDetailsFormControl }) {
  return (
    <IntegerFieldRf
      controllerProps={{ control, name: 'maxNumKlines' }}
      fieldProps={{
        label: 'Maximum number of candlesticks per execution',
        className: 'min-w-[25rem] flex-grow',
        required: true,
      }}
    />
  );
}
function StartTimestampField({ control }: { control: GeneralDetailsFormControl }) {
  return (
    <DateTimePickerRf
      controllerProps={{ control, name: 'btRange.start' }}
      dateTimePickerProps={{
        label: 'Start timestamp',
        className: 'min-w-[8rem] flex-grow',
        ampm: false,
        disableFuture: true,
      }}
      textFieldProps={{ required: true }}
    />
  );
}
function EndTimestampField({ control }: { control: GeneralDetailsFormControl }) {
  return (
    <DateTimePickerRf
      controllerProps={{ control, name: 'btRange.end' }}
      dateTimePickerProps={{
        label: 'End timestamp',
        className: 'min-w-[8rem] flex-grow',
        ampm: false,
        disableFuture: true,
      }}
      textFieldProps={{ required: true }}
    />
  );
}
