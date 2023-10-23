import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { UseQueryResult } from '@tanstack/react-query';
import { isAfter, isBefore, isFuture } from 'date-fns';
import { flow } from 'fp-ts/lib/function';
import { prop, toPairs } from 'ramda';
import { PropsWithChildren } from 'react';
import { Control, useController } from 'react-hook-form';

import IntegerField from '#components/IntegerField';
import { exchangeNameEnum } from '#features/exchanges/exchange';
import { Timeframe } from '#features/klines/kline';
import { Symbol } from '#features/symbols/symbol';
import { GetSymbolsError } from '#features/symbols/symbol.repository';

import { BacktestForm } from '../types';

type GeneralDetailsStepProps = PropsWithChildren<{
  control: Control<BacktestForm>;
  querySymbolsResult: UseQueryResult<readonly Symbol[], GetSymbolsError>;
}>;
export default function GeneralDetailsStep(props: GeneralDetailsStepProps) {
  const { control, querySymbolsResult, children } = props;

  return (
    <div
      className={
        querySymbolsResult.data === undefined
          ? 'invisible'
          : 'flex max-w-fit flex-col rounded-xl bg-background p-4 shadow-2 lg:mt-6 lg:p-10'
      }
    >
      <StrategyNameField control={control} />
      <Divider textAlign="center" className="mb-4">
        Symbol information
      </Divider>
      <div className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
        <ExchangeField control={control} />
        <SymbolField control={control} symbols={querySymbolsResult.data ?? []} />
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
      {children}
    </div>
  );
}

function StrategyNameField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref: inputRef, ...restFieldProps },
    fieldState,
  } = useController({
    name: 'name',
    control,
    rules: { required: 'Strategy name is required' },
  });

  return (
    <TextField
      id="strategy-name-field"
      label="Strategy name"
      className="w-full"
      required
      {...restFieldProps}
      inputRef={inputRef}
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
    />
  );
}

function ExchangeField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref: inputRef, ...restFieldProps },
  } = useController({ name: 'exchange', control });

  const labelId = 'exchange-field-label';
  const labelText = 'Exchange';

  return (
    <FormControl className="min-w-[8rem] flex-grow" disabled>
      <InputLabel id={labelId}>{labelText}</InputLabel>
      <Select
        id="exchange-field"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId, 'aria-disabled': true }}
        {...restFieldProps}
        inputRef={inputRef}
      >
        <MenuItem value={exchangeNameEnum.BINANCE} selected>
          Binance
        </MenuItem>
      </Select>
      <FormHelperText> </FormHelperText>
    </FormControl>
  );
}

function SymbolField({ control, symbols }: { control: Control<BacktestForm>; symbols: readonly Symbol[] }) {
  const {
    field: { ref, onChange, ...restFieldProps },
    fieldState,
  } = useController({
    name: 'symbol',
    control,
    rules: { required: 'Symbol is required' },
  });

  return (
    <Autocomplete
      id="symbol-field"
      data-testid="symbol-input"
      className="min-w-[10rem] flex-grow"
      options={symbols.map(prop('name'))}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Symbol"
          variant="outlined"
          required
          inputRef={ref}
          error={fieldState.invalid}
          helperText={fieldState.error?.message ?? ' '}
        />
      )}
      autoComplete
      includeInputInList
      {...restFieldProps}
      onChange={(_, data) => onChange(data)}
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
function TimeframeField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref, ...restFieldProps },
    fieldState,
  } = useController({
    name: 'timeframe',
    control,
    rules: { required: 'Timeframe is required' },
  });

  const labelId = 'timeframe-field-label';
  const labelText = 'Timeframe';

  return (
    <FormControl className="min-w-[10rem] flex-grow" error={fieldState.invalid}>
      <InputLabel id={labelId} required>
        {labelText}
      </InputLabel>
      <Select
        id="timeframe-field"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId }}
        MenuProps={{ className: 'max-h-96' }}
        required
        inputRef={ref}
        {...restFieldProps}
      >
        {toPairs(timeframeOptions).map(([value, label], index) => (
          <MenuItem key={index} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{fieldState.error?.message ?? ' '}</FormHelperText>
    </FormControl>
  );
}

function MaxNumKlinesField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref, onChange, onBlur, ...restFieldProps },
    fieldState,
  } = useController({
    name: 'maxNumKlines',
    control,
    rules: {
      required: 'This field is required',
      min: { value: 1, message: 'This field must be greater than 0' },
    },
  });

  return (
    <IntegerField
      label="Maximum number of candlesticks per execution"
      className="min-w-[25rem] flex-grow"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      {...restFieldProps}
      inputRef={ref}
      onChange={onChange}
      onBlur={flow(onChange, onBlur)}
    />
  );
}

function StartTimestampField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref, ...restFieldProps },
    fieldState,
  } = useController({
    name: 'startTimestamp',
    control,
    rules: {
      required: 'Start timestamp is required',
      validate: (startTimestamp, { endTimestamp }) =>
        isAfter(startTimestamp, endTimestamp)
          ? 'Start timestamp must be before end timestamp'
          : isFuture(startTimestamp)
          ? 'Start timestamp must not be in the future'
          : undefined,
    },
  });

  return (
    <DateTimePicker
      label="Start timestamp"
      className="min-w-[8rem] flex-grow"
      ampm={false}
      disableFuture
      slotProps={{
        textField: {
          error: fieldState.invalid,
          helperText: fieldState.error?.message ?? ' ',
          required: true,
          inputRef: ref,
          ...restFieldProps,
        },
      }}
    />
  );
}

function EndTimestampField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref, ...restFieldProps },
    fieldState,
  } = useController({
    name: 'endTimestamp',
    control,
    rules: {
      required: 'End timestamp is required',
      validate: (endTimestamp, { startTimestamp }) =>
        isBefore(endTimestamp, startTimestamp)
          ? 'End timestamp must be after start timestamp'
          : isFuture(endTimestamp)
          ? 'End timestamp must not be in the future'
          : undefined,
    },
  });

  return (
    <DateTimePicker
      label="End timestamp"
      className="min-w-[8rem] flex-grow"
      ampm={false}
      disableFuture
      slotProps={{
        textField: {
          error: fieldState.invalid,
          helperText: fieldState.error?.message ?? ' ',
          required: true,
        },
      }}
      {...restFieldProps}
      inputRef={ref}
    />
  );
}
