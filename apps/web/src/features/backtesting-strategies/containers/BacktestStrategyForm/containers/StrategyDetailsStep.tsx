import { OnValidate } from '@monaco-editor/react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { flow } from 'fp-ts/lib/function';
import { MarkerSeverity } from 'monaco-editor';
import { pick } from 'ramda';
import { MouseEventHandler, PropsWithChildren, useState } from 'react';
import { Control, useController, useWatch } from 'react-hook-form';

import DecimalField from '#components/DecimalField';
import FetchingFailed from '#components/FetchingFailed';
import MaterialSymbol from '#components/MaterialSymbol';
import { StrategyEditor } from '#components/StrategyEditor';
import TechnicalChart from '#containers/TechnicalChart';
import { strategyLanguageOptions } from '#features/backtesting-strategies/domain/btStrategy.entity';
import useKlines from '#features/klines/hooks/useKlines';
import { GetKlinesRequest } from '#features/klines/kline.repository';
import { Symbol, SymbolName } from '#features/symbols/symbol';

import { BacktestForm } from '../types';

type StrategyDetailsStepProps = PropsWithChildren<{
  control: Control<BacktestForm>;
  formValues: BacktestForm & { symbol: SymbolName };
  selectedSymbol: Symbol;
}>;
export default function StrategyDetailsStep(props: StrategyDetailsStepProps) {
  const { control, formValues, selectedSymbol, children } = props;

  const getKlinesRequest = createGetKlinesRequest(formValues);
  const [autoFetchKlines, setAutoFetchKlines] = useState(true);
  const queryKlinesResult = useKlines(getKlinesRequest, autoFetchKlines);

  if (queryKlinesResult.isError && autoFetchKlines) setAutoFetchKlines(false);
  const handleRetryFetchKlines: MouseEventHandler<HTMLButtonElement> = () => setAutoFetchKlines(true);

  return (
    <div className="flex w-full flex-col rounded-xl bg-background p-4 shadow-2 lg:mt-6 lg:p-10">
      {queryKlinesResult.isInitialLoading ? <CircularProgress className="abs-center" /> : undefined}
      <FetchingFailed
        className="abs-center"
        error={queryKlinesResult.error}
        onRetry={handleRetryFetchKlines}
      />
      <div className={queryKlinesResult.data === undefined ? 'invisible' : 'flex flex-col gap-y-4'}>
        <Accordion>
          <AccordionSummary className="font-medium" expandIcon={<MaterialSymbol symbol="expand_more" />}>
            Technical chart
          </AccordionSummary>
          <AccordionDetails>
            <TechnicalChart />
          </AccordionDetails>
        </Accordion>
        <div className="mt-4 flex gap-x-6">
          <CapitalCurrencyField control={control} selectedSymbol={selectedSymbol} />
          <InitialCapitalField control={control} />
          <TakerFeeRateField control={control} />
          <MakerFeeRateField control={control} />
        </div>
        <StrategyBodyField control={control}>
          <StrategyLanguageField control={control} />
        </StrategyBodyField>
        {children}
      </div>
    </div>
  );
}
function createGetKlinesRequest(formValues: BacktestForm & { symbol: SymbolName }): GetKlinesRequest {
  return pick(['exchange', 'symbol', 'timeframe', 'startTimestamp', 'endTimestamp'], formValues);
}

function CapitalCurrencyField(props: { control: Control<BacktestForm>; selectedSymbol: Symbol }) {
  const { control, selectedSymbol } = props;

  const {
    field: { ref, ...restFieldProps },
    fieldState,
  } = useController({
    name: 'capitalCurrency',
    control,
    rules: { required: 'Capital currency is required' },
  });

  const labelText = 'Capital currency';
  const labelId = 'capital-currency-label';

  return (
    <FormControl className="min-w-[10rem] flex-grow" error={fieldState.invalid}>
      <InputLabel id={labelId} required>
        {labelText}
      </InputLabel>
      <Select
        id="currency"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId }}
        required
        {...restFieldProps}
        inputRef={ref}
      >
        <MenuItem value={selectedSymbol.baseAsset}>{selectedSymbol.baseAsset}</MenuItem>
        <MenuItem value={selectedSymbol.quoteAsset}>{selectedSymbol.quoteAsset}</MenuItem>
      </Select>
      <FormHelperText>{fieldState.error?.message ?? ' '}</FormHelperText>
    </FormControl>
  );
}

function InitialCapitalField({ control }: { control: Control<BacktestForm> }) {
  const currency = useWatch({ name: 'capitalCurrency', control });
  const {
    field: { ref, onChange, onBlur, ...restFieldProps },
    fieldState,
  } = useController({
    name: 'initialCapital',
    control,
    rules: {
      required: 'Initial capital is required',
      validate: (initialCapital) =>
        Number(initialCapital) <= 0 ? 'Inital capital must be greater than 0' : undefined,
    },
  });

  return (
    <DecimalField
      label="Initial capital"
      className="min-w-[8rem] flex-grow"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      InputProps={{ endAdornment: currency }}
      {...restFieldProps}
      inputRef={ref}
      onChange={onChange}
      onBlur={flow(onChange, onBlur)}
    />
  );
}

function TakerFeeRateField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref, onChange, onBlur, ...restFieldProps },
    fieldState,
  } = useController({
    control,
    name: 'takerFeeRate',
    rules: {
      required: 'Taker fee rate is required',
      min: { value: 0, message: 'Fee rate must be between 0 and 100' },
      max: { value: 100, message: 'Fee rate must be between 0 and 100' },
    },
  });

  return (
    <DecimalField
      label="Taker fee rate"
      className="min-w-[8rem] flex-grow"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      InputProps={{ endAdornment: '%' }}
      {...restFieldProps}
      inputRef={ref}
      onChange={onChange}
      onBlur={flow(onChange, onBlur)}
    />
  );
}

function MakerFeeRateField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref, onChange, onBlur, ...restFieldProps },
    fieldState,
  } = useController({
    control,
    name: 'makerFeeRate',
    rules: {
      required: 'Maker fee rate is required',
      min: { value: 0, message: 'Fee rate must be between 0 and 100' },
      max: { value: 100, message: 'Fee rate must be between 0 and 100' },
    },
  });

  return (
    <DecimalField
      label="Maker fee rate"
      className="min-w-[8rem] flex-grow"
      required
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? ' '}
      InputProps={{ endAdornment: '%' }}
      {...restFieldProps}
      inputRef={ref}
      onChange={onChange}
      onBlur={flow(onChange, onBlur)}
    />
  );
}

function StrategyLanguageField({ control }: { control: Control<BacktestForm> }) {
  const {
    field: { ref, ...restFieldProps },
  } = useController({ name: 'language', control });

  const labelId = 'strategy-language-label';
  const labelText = 'Language';

  return (
    <FormControl className="mb-2 min-w-[12rem] flex-grow sm:max-w-[16rem]">
      <InputLabel id={labelId} required>
        {labelText}
      </InputLabel>
      <Select
        id="language"
        labelId={labelId}
        label={labelText}
        inputProps={{ 'aria-labelledby': labelId }}
        required
        {...restFieldProps}
        inputRef={ref}
      >
        {strategyLanguageOptions.map((value, index) => (
          <MenuItem key={index} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function StrategyBodyField({ control, children }: PropsWithChildren<{ control: Control<BacktestForm> }>) {
  const selectedLanguageValue = useWatch({ name: 'language', control });
  const { field, fieldState } = useController({
    name: 'body',
    control,
    rules: { required: 'Strategy body is required' },
  });

  const labelId = 'strategy-body-label';

  const handleEditorMarker: OnValidate = (markers) => {
    // Monaco Marker Severity: Hint = 1, Info = 2, Warning = 4, Error = 8
    const errorMarker = markers.find((marker) => marker.severity === (8 as MarkerSeverity));
    if (errorMarker) control.setError('body', { type: 'value', message: 'Invalid syntax' });
  };

  return (
    <FormControl className="w-full" error={fieldState.invalid}>
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex min-w-[10rem] sm:flex-col">
          <InputLabel id={labelId} required className="relative mb-1 transform-none">
            Strategy body
          </InputLabel>
          <FormHelperText>{fieldState.invalid ? `(${fieldState.error?.message})` : ' '}</FormHelperText>
        </div>
        {children}
      </div>
      <StrategyEditor
        language={selectedLanguageValue}
        value={field.value}
        wrapperProps={{ 'aria-labelledby': labelId }}
        onValidate={handleEditorMarker}
        onChange={field.onChange}
      />
    </FormControl>
  );
}
