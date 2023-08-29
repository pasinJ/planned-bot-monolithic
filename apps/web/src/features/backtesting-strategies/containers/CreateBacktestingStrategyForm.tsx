import Autocomplete from '@mui/material/Autocomplete';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { UseQueryResult } from '@tanstack/react-query';
import { isBefore } from 'date-fns';
import { dissoc, omit, prop, propEq, props } from 'ramda';
import { Control, Form, useController, useForm, useWatch } from 'react-hook-form';

import { DecimalField } from '#components/DecimalField';
import { IntegerField } from '#components/IntegerField';
import { Exchange, exchangeEnum } from '#features/shared/domain/exchange';
import { Symbol } from '#features/symbols/domain/symbol.valueObject';
import useSymbols from '#features/symbols/hooks/useSymbols';
import { GetSymbolsError } from '#features/symbols/repositories/symbol.type';

type CreateBacktestingStrategyControl = Control<FormValues>;
type FormValues = {
  name: string;
  exchange: Exchange;
  symbol: string;
  currency: string;
  takerFeeRate: string;
  makerFeeRate: string;
  maxNumCandlesticks: string;
  startTimestamp: Date;
  endTimestamp: Date;
};
const defaultValues = {
  name: '',
  exchange: exchangeEnum.BINANCE,
  symbol: '',
  currency: '',
  takerFeeRate: '0.0',
  makerFeeRate: '0.0',
  maxNumCandlesticks: '100',
  startTimestamp: new Date(),
  endTimestamp: new Date(),
};

export default function CreateBacktestingStrategyForm() {
  const { control } = useForm({ defaultValues, mode: 'all' });
  const symbols = useSymbols(true);

  return (
    <Form aria-label="create backtesting strategy" control={control}>
      <StrategyNameField control={control} />
      <ExchangeField control={control} />
      <SymbolField control={control} symbols={symbols} />
      <CurrencyField control={control} symbols={symbols} />
      <TakerFeeRateField control={control} />
      <MakerFeeRateField control={control} />
      <MaxNumCandlesticksField control={control} />
      <StartTimestampField control={control} />
      <EndTimestampField control={control} />
    </Form>
  );
}

function StrategyNameField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'name',
    control,
    rules: { required: 'Strategy name is required' },
  });

  return (
    <TextField
      id="strategy-name"
      label="Strategy name"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message}
      {...dissoc('ref', field)}
    />
  );
}

function ExchangeField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field } = useController({ name: 'exchange', control });

  return (
    <FormControl disabled>
      <InputLabel id="exchange-label">Exchange</InputLabel>
      <Select id="exchange" labelId="exchange-label" {...dissoc('ref', field)}>
        <MenuItem value={exchangeEnum.BINANCE} selected>
          Binance
        </MenuItem>
      </Select>
    </FormControl>
  );
}

function SymbolField({
  control,
  symbols,
}: {
  control: CreateBacktestingStrategyControl;
  symbols: UseQueryResult<readonly Symbol[], GetSymbolsError>;
}) {
  const { field, fieldState } = useController({
    name: 'symbol',
    control,
    rules: { required: 'Symbol is required' },
  });

  const symbolOptions = symbols.data?.map(prop('name')) ?? [];

  return (
    <Autocomplete
      id="symbol"
      data-testid="symbol-input"
      options={['', ...symbolOptions]}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Symbol"
          variant="outlined"
          required
          error={fieldState.invalid}
          helperText={fieldState.error?.message}
        />
      )}
      autoComplete
      includeInputInList
      {...omit(['ref'], field)}
      onChange={(_, data) => field.onChange(data)}
    />
  );
}

function CurrencyField({
  control,
  symbols,
}: {
  control: CreateBacktestingStrategyControl;
  symbols: UseQueryResult<readonly Symbol[], GetSymbolsError>;
}) {
  const { field, fieldState } = useController({
    name: 'currency',
    control,
    rules: { required: 'Currency is required' },
  });
  const selectedSymbolValue = useWatch({ name: 'symbol', control });

  const selectedSymbol = symbols.data?.find(propEq(selectedSymbolValue, 'name'));

  return (
    <FormControl data-testid="currency-field" error={fieldState.invalid}>
      <InputLabel id="currency-label">Currency</InputLabel>
      <Select
        id="currency-select"
        labelId="currency-label"
        inputProps={{ 'data-testid': 'currency-input' }}
        {...dissoc('ref', field)}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {selectedSymbol
          ? props(['baseAsset', 'quoteAsset'], selectedSymbol).map((value, index) => (
              <MenuItem key={index} value={value}>
                {value}
              </MenuItem>
            ))
          : null}
      </Select>
      <FormHelperText>{fieldState.error?.message}</FormHelperText>
    </FormControl>
  );
}

function TakerFeeRateField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'takerFeeRate',
    control,
    rules: {
      max: { value: 100, message: 'Fee rate must be between 0 and 100' },
      required: 'Taker fee rate is required',
    },
  });

  return (
    <DecimalField
      label="Taker fee rate"
      error={fieldState.invalid}
      helperText={fieldState.error?.message}
      {...dissoc('ref', field)}
    />
  );
}

function MakerFeeRateField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'makerFeeRate',
    control,
    rules: {
      max: { value: 100, message: 'Fee rate must be between 0 and 100' },
      required: 'Maker fee rate is required',
    },
  });

  return (
    <DecimalField
      label="Maker fee rate"
      error={fieldState.invalid}
      helperText={fieldState.error?.message}
      {...dissoc('ref', field)}
    />
  );
}

function MaxNumCandlesticksField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'maxNumCandlesticks',
    control,
    rules: { required: 'This field is required' },
  });

  return (
    <IntegerField
      label="Maximum number of candlesticks per execution"
      error={fieldState.invalid}
      helperText={fieldState.error?.message}
      {...dissoc('ref', field)}
    />
  );
}

function StartTimestampField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'startTimestamp',
    control,
    rules: { required: 'Start timestamp is required' },
  });

  return (
    <DateTimePicker
      label="Start timestamp"
      ampm={false}
      disableFuture
      slotProps={{ textField: { error: fieldState.invalid, helperText: fieldState.error?.message } }}
      {...dissoc('ref', field)}
    />
  );
}

function EndTimestampField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'endTimestamp',
    control,
    rules: {
      required: 'End timestamp is required',
      validate: (value, form) =>
        isBefore(value, form.startTimestamp) ? 'End timestamp must be after start timestamp' : undefined,
    },
  });

  return (
    <DateTimePicker
      label="End timestamp"
      ampm={false}
      disableFuture
      slotProps={{ textField: { error: fieldState.invalid, helperText: fieldState.error?.message } }}
      {...dissoc('ref', field)}
    />
  );
}
