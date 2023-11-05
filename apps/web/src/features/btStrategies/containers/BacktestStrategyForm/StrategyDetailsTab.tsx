import { zodResolver } from '@hookform/resolvers/zod';
import { OnValidate } from '@monaco-editor/react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import * as o from 'fp-ts/lib/Option';
import { MarkerSeverity, editor } from 'monaco-editor';
import { equals } from 'ramda';
import {
  FormEventHandler,
  MouseEventHandler,
  PropsWithChildren,
  RefCallback,
  forwardRef,
  useRef,
} from 'react';
import { Control, UseFormProps, useController, useWatch } from 'react-hook-form';
import { z } from 'zod';

import DecimalFieldRf from '#components/DecimalFieldRf';
import MaterialSymbol from '#components/MaterialSymbol';
import SelectFieldRf from '#components/SelectFieldRf';
import StrategyEditor from '#components/StrategyEditor';
import TechnicalChart from '#containers/TechnicalChart';
import {
  AssetCurrency,
  BtStrategyBody,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  StrategyLanguage,
  TakerFeeRate,
  btStrategyBodySchema,
  capitalCurrencySchema,
  getAssetCurrency,
  initialCapitalSchema,
  makerFeeRateSchema,
  strategyLanguageOptions,
  strategyLanguageSchama,
  takerFeeRateSchema,
} from '#features/btStrategies/btStrategy';
import useExecuteBtStrategy from '#features/btStrategies/hooks/useExecuteBtStrategy';
import useSaveBtStrategy from '#features/btStrategies/hooks/useSaveBtStrategy';
import { Kline } from '#features/klines/kline';
import { BaseAsset, QuoteAsset, Symbol } from '#features/symbols/symbol';
import useFormZod from '#hooks/useFormZod';
import { AppError, getCausesList } from '#shared/errors/appError';
import { DecimalString } from '#shared/utils/string';
import { schemaForType } from '#shared/utils/zod';

import type { LastExecution } from '.';
import { GeneralDetails } from './GeneralDetailsTab';

type StrategyDetailsTabProps = { klines: readonly Kline[] } & StrategyDetailsFormProps;
export default function StrategyDetailsTab(props: StrategyDetailsTabProps) {
  const { klines, ...formProps } = props;

  return (
    <Card className="flex w-full flex-col gap-y-2 rounded-xl bg-background p-4 shadow-2 lg:mt-6 lg:p-8">
      <Accordion className="bg-gray-200/50 dark:bg-gray-500/25">
        <AccordionSummary className="font-medium" expandIcon={<MaterialSymbol symbol="expand_more" />}>
          Technical chart
        </AccordionSummary>
        <AccordionDetails>
          <TechnicalChart klines={klines} />
        </AccordionDetails>
      </Accordion>
      <StrategyDetailsForm {...formProps} />
    </Card>
  );
}

type StrategyDetailsFormControl = Control<StrategyDetailsFormValues>;

export type StrategyDetailsFormValues = {
  capitalCurrency: BaseAsset | QuoteAsset | '';
  initialCapital: DecimalString;
  takerFeeRate: DecimalString;
  makerFeeRate: DecimalString;
  language: StrategyLanguage;
  body: BtStrategyBody;
};
export type StrategyDetails = {
  capitalCurrency: CapitalCurrency;
  initialCapital: InitialCapital;
  takerFeeRate: TakerFeeRate;
  makerFeeRate: MakerFeeRate;
  language: StrategyLanguage;
  body: BtStrategyBody;
};
const strategyDetailsSchema = schemaForType<StrategyDetails>().with(
  z.object({
    capitalCurrency: z
      .string({ invalid_type_error: 'Capital currency is required' })
      .pipe(capitalCurrencySchema),
    initialCapital: z.coerce.number().pipe(initialCapitalSchema),
    takerFeeRate: z.coerce.number().pipe(takerFeeRateSchema),
    makerFeeRate: z.coerce.number().pipe(makerFeeRateSchema),
    language: strategyLanguageSchama,
    body: btStrategyBodySchema,
  }),
);

const strategyDetailsFormOptions: Partial<UseFormProps<StrategyDetailsFormValues>> = {
  mode: 'all',
  resolver: zodResolver(strategyDetailsSchema),
};

type StrategyDetailsFormProps = {
  formValues: StrategyDetailsFormValues;
  selectedSymbol: Symbol;
  generalDetails: GeneralDetails;
  moveToPrevTab: (formValues: StrategyDetailsFormValues, isSubFormDirty: boolean) => void;
  moveToNextTab: (
    formValues: StrategyDetailsFormValues,
    formValidValues: StrategyDetails & { assetCurrency: AssetCurrency },
  ) => void;
  lastExecution: o.Option<LastExecution>;
  setLastExecution: (lastExecution: o.Option<LastExecution>) => void;
};
function StrategyDetailsForm(props: StrategyDetailsFormProps) {
  const {
    formValues,
    selectedSymbol,
    generalDetails,
    moveToPrevTab,
    moveToNextTab,
    lastExecution,
    setLastExecution,
  } = props;

  const { control, formState, getValues, handleSubmit } = useFormZod<
    StrategyDetailsFormValues,
    StrategyDetails
  >({
    ...strategyDetailsFormOptions,
    defaultValues: formValues,
    values: formValues,
  });
  const { isDirty, errors } = formState;

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const handleEditorRef: RefCallback<editor.IStandaloneCodeEditor> = (monaco) => {
    editorRef.current = monaco;
  };

  const saveBtStrategy = useSaveBtStrategy();
  const executeBtStrategy = useExecuteBtStrategy();

  const handleSubmitForm: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (errors.body) return editorRef.current?.focus();

    void handleSubmit(async (strategyDetails) => {
      const assetCurrency = getAssetCurrency(selectedSymbol, strategyDetails.capitalCurrency);
      const newRequest = { ...generalDetails, ...strategyDetails, assetCurrency };

      if (o.isNone(lastExecution) || !equals(newRequest, lastExecution.value.request)) {
        const btStrategyId = await saveBtStrategy.mutateAsync(newRequest);
        const { id } = await executeBtStrategy.mutateAsync(btStrategyId);
        setLastExecution(o.some({ btExecutionId: id, request: newRequest }));
      }

      moveToNextTab(getValues(), { ...strategyDetails, assetCurrency });
    })(e);
  };
  const handleBackToPrevTab: MouseEventHandler<HTMLButtonElement> = () => {
    return moveToPrevTab(getValues(), isDirty);
  };

  return (
    <>
      <form className="flex flex-col gap-y-4" onSubmit={handleSubmitForm}>
        <div className="mt-4 flex flex-wrap gap-x-6">
          <CapitalCurrencyField control={control} selectedSymbol={selectedSymbol} />
          <InitialCapitalField control={control} />
          <div className="flex flex-grow flex-wrap gap-x-6">
            <TakerFeeRateField control={control} />
            <MakerFeeRateField control={control} />
          </div>
        </div>
        <StrategyBodyField ref={handleEditorRef} control={control}>
          <StrategyLanguageField control={control} />
        </StrategyBodyField>
        <Divider />
        <div className="mt-2 flex items-center justify-between">
          <Button variant="outlined" onClick={handleBackToPrevTab}>
            Back
          </Button>
          <PendingSaveBtStrategy isLoading={saveBtStrategy.isLoading} />
          <PendingExecuteBtStrategy isLoading={executeBtStrategy.isLoading} />
          <ErrorMessage error={saveBtStrategy.error ?? executeBtStrategy.error} />
          <Button
            type="submit"
            variant="contained"
            disabled={saveBtStrategy.isLoading || executeBtStrategy.isLoading}
          >
            View result
          </Button>
        </div>
      </form>
    </>
  );
}
function CapitalCurrencyField(props: {
  control: StrategyDetailsFormControl;
  selectedSymbol: Symbol | undefined;
}) {
  const { control, selectedSymbol } = props;

  return (
    <SelectFieldRf
      controllerProps={{ control, name: 'capitalCurrency' }}
      formControlProps={{ className: 'min-w-[10rem] flex-grow' }}
      selectProps={{
        id: 'currency',
        label: 'Capital currency',
        labelId: 'capital-currency-label',
        required: true,
      }}
    >
      <MenuItem value={''}>None</MenuItem>
      {selectedSymbol !== undefined
        ? [selectedSymbol.baseAsset, selectedSymbol.quoteAsset].map((value, index) => (
            <MenuItem key={index} value={value}>
              {value}
            </MenuItem>
          ))
        : undefined}
    </SelectFieldRf>
  );
}
function InitialCapitalField({ control }: { control: StrategyDetailsFormControl }) {
  const currency = useWatch({ name: 'capitalCurrency', control });

  return (
    <DecimalFieldRf
      controllerProps={{ control, name: 'initialCapital' }}
      fieldProps={{
        label: 'Initial capital',
        className: 'min-w-[10rem] flex-grow',
        required: true,
        InputProps: { endAdornment: currency },
      }}
    />
  );
}
function TakerFeeRateField({ control }: { control: StrategyDetailsFormControl }) {
  return (
    <DecimalFieldRf
      controllerProps={{ control, name: 'takerFeeRate' }}
      fieldProps={{
        label: 'Taker fee rate',
        className: 'min-w-[10rem] flex-grow',
        required: true,
        InputProps: { endAdornment: '%' },
      }}
    />
  );
}
function MakerFeeRateField({ control }: { control: StrategyDetailsFormControl }) {
  return (
    <DecimalFieldRf
      controllerProps={{ control, name: 'makerFeeRate' }}
      fieldProps={{
        label: 'Maker fee rate',
        className: 'min-w-[10rem] flex-grow',
        required: true,
        InputProps: { endAdornment: '%' },
      }}
    />
  );
}
function StrategyLanguageField({ control }: { control: StrategyDetailsFormControl }) {
  return (
    <SelectFieldRf
      controllerProps={{ control, name: 'language' }}
      formControlProps={{ className: 'mb-2 min-w-[12rem] flex-grow sm:max-w-[16rem]' }}
      selectProps={{
        id: 'strategy-language',
        labelId: 'strategy-language-label',
        label: 'Language',
        required: true,
      }}
    >
      {strategyLanguageOptions.map((value, index) => (
        <MenuItem key={index} value={value}>
          {value}
        </MenuItem>
      ))}
    </SelectFieldRf>
  );
}
const StrategyBodyField = forwardRef<
  editor.IStandaloneCodeEditor | null,
  PropsWithChildren<{ control: StrategyDetailsFormControl }>
>(function StrategyBodyField({ control, children }, ref) {
  const selectedLanguageValue = useWatch({ control, name: 'language' });
  const { field, fieldState } = useController({ control, name: 'body' });

  const labelId = 'strategy-body-label';

  const handleEditorMarker: OnValidate = (markers) => {
    // Monaco Marker Severity: Hint = 1, Info = 2, Warning = 4, Error = 8
    const errorMarker = markers.find((marker) => marker.severity === (8 as MarkerSeverity));
    if (errorMarker) control.setError('body', { type: 'value', message: 'Invalid syntax' });
  };

  return (
    <FormControl className="flex flex-col" error={fieldState.invalid}>
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex min-w-[10rem] sm:flex-col">
          <InputLabel id={labelId} required className="relative mb-1 transform-none">
            Strategy body
          </InputLabel>
          <FormHelperText>{fieldState.invalid ? `(${fieldState.error?.message})` : ' '}</FormHelperText>
        </div>
        {children}
      </div>
      <div className="h-[60vh]">
        <StrategyEditor
          ref={ref}
          language={selectedLanguageValue}
          value={field.value}
          wrapperProps={{ 'aria-labelledby': labelId }}
          onValidate={handleEditorMarker}
          onChange={field.onChange}
        />
      </div>
    </FormControl>
  );
});

function PendingSaveBtStrategy({ isLoading }: { isLoading: boolean }) {
  return isLoading ? (
    <div className="flex items-center gap-x-4">
      <CircularProgress size="2rem" />
      <Typography>Saving backtesting strategy</Typography>
    </div>
  ) : undefined;
}
function PendingExecuteBtStrategy({ isLoading }: { isLoading: boolean }) {
  return isLoading ? (
    <div className="flex items-center gap-x-4">
      <CircularProgress size="2rem" />
      <Typography>Submitting execution request</Typography>
    </div>
  ) : undefined;
}
function ErrorMessage({ error }: { error: AppError | null }) {
  return error !== null ? (
    <Tooltip title={getCausesList(error).join(' => ')} slotProps={{ tooltip: { className: 'text-md' } }}>
      <Typography className="flex gap-2 text-error">
        <MaterialSymbol symbol="error" />
        {error.message}
      </Typography>
    </Tooltip>
  ) : undefined;
}
