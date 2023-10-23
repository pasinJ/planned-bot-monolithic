import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { prop, toPairs } from 'ramda';
import { MouseEventHandler, useState } from 'react';
import { Control, useController } from 'react-hook-form';

import FetchingFailed from '#components/FetchingFailed';
import IntegerField from '#components/IntegerField';
import { exchangeNameEnum } from '#features/exchanges/domain/exchange';
import { Timeframe } from '#features/klines/kline';
import useSymbols from '#features/symbols/hooks/useSymbols';
import { Symbol } from '#features/symbols/symbol';

import { BacktestForm } from '../types';

type GeneralDetailsStepProps = { control: Control<BacktestForm> };
export default function GeneralDetailsStep(props: GeneralDetailsStepProps) {
  const { control } = props;

  const [autoFetchingSymbols, setAutoFetchingSymbols] = useState(true);
  const symbols = useSymbols(autoFetchingSymbols);

  if (symbols.isError && autoFetchingSymbols) setAutoFetchingSymbols(false);
  const handleRetryFetchSymbols: MouseEventHandler<HTMLButtonElement> = () => setAutoFetchingSymbols(true);

  return (
    <div className="relative flex min-w-fit flex-col">
      {symbols.isInitialLoading ? <CircularProgress className="abs-center" /> : undefined}
      <FetchingFailed className="abs-center" error={symbols.error} onRetry={handleRetryFetchSymbols} />
      <div className={symbols.data === undefined ? 'invisible' : ''}>
        <StrategyNameField control={control} />
        <Divider textAlign="center" className="mb-4">
          Symbol information
        </Divider>
        <div className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
          <ExchangeField control={control} />
          <SymbolField control={control} symbols={symbols.data ?? []} />
        </div>
        <div className="mb-2 flex flex-wrap gap-x-6 gap-y-2">
          <TimeframeField control={control} />
          <MaxNumKlinesField control={control} />
        </div>
      </div>
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
    field: { ref, onChange, ...restFieldProps },
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
      onBlur={onChange}
    />
  );
}
