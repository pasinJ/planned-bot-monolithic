import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import * as o from 'fp-ts/lib/Option';
import { isNil, isNotNil, propEq } from 'ramda';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import PendingFetch from '#components/PendingFetch';
import { BtExecutionId } from '#features/btStrategies/btExecution';
import {
  AssetCurrency,
  BtRange,
  BtStrategy,
  BtStrategyBody,
  MaxNumKlines,
  extendBtRange,
} from '#features/btStrategies/btStrategy';
import useBtStrategy from '#features/btStrategies/hooks/useBtStrategy';
import { UseSaveBtStrategyRequest } from '#features/btStrategies/hooks/useSaveBtStrategy';
import { ExchangeName, exchangeNameEnum } from '#features/exchanges/exchange';
import useKlines, { UseKlinesRequest } from '#features/klines/hooks/useKlines';
import { Timeframe } from '#features/klines/kline';
import useSymbols from '#features/symbols/hooks/useSymbols';
import { Symbol, SymbolName } from '#features/symbols/symbol';
import useAutoFetch from '#hooks/useAutoFetch';
import useObjState from '#hooks/useObjState';
import useOptionState from '#hooks/useOptionState';
import { ValidDate } from '#shared/utils/date';
import {
  DecimalString,
  IntegerString,
  numberToDecimalString,
  numberToIntegerString,
} from '#shared/utils/string';
import { isUndefined } from '#shared/utils/typeGuards';

import BacktestingResultTab from './BacktestingResultTab';
import GeneralDetailsTab, { GeneralDetails, GeneralDetailsFormValues } from './GeneralDetailsTab';
import StrategyDetailsTab, { StrategyDetails, StrategyDetailsFormValues } from './StrategyDetailsTab';

const tabs = ['General datails', 'Strategy details', 'Backtesting result'];

type FormsValues = GeneralDetailsFormValues & StrategyDetailsFormValues;
const defaultFormsValues: FormsValues = {
  name: '',
  exchange: exchangeNameEnum.BINANCE,
  symbol: null,
  timeframe: '',
  maxNumKlines: '100' as IntegerString,
  btRange: { start: new Date() as ValidDate, end: new Date() as ValidDate },
  capitalCurrency: '',
  assetCurrency: '',
  initialCapital: '1000' as DecimalString,
  takerFeeRate: '0' as DecimalString,
  makerFeeRate: '0' as DecimalString,
  language: 'typescript',
  body: 'console.log("Hello world!");' as BtStrategyBody,
};

export type LastExecution = { btExecutionId: BtExecutionId; request: UseSaveBtStrategyRequest };

export default function BacktestStrategyForm() {
  const [activeTab, setActiveTab] = useState(0);

  const [formsValues, setFormsValues] = useObjState<FormsValues>(defaultFormsValues);
  const [generalDetails, setGeneralDetails] = useOptionState<GeneralDetails>(o.none);
  const [strategyDetails, setStrategyDetails] = useOptionState<
    StrategyDetails & { assetCurrency: AssetCurrency }
  >(o.none);

  const [fetchSymbols, handleRefetchSymbols] = useAutoFetch(true, useSymbols);
  const [selectedSymbol, setSelectedSymbol] = useOptionState<Symbol>(o.none);
  const [lastExecution, setLastExecution] = useOptionState<LastExecution>(o.none);

  const params = useParams();
  const [fetchBtStrategy, handleRefetchBtStrategy] = useAutoFetch(
    isNotNil(params.btStrategyId),
    useBtStrategy,
    [params.btStrategyId],
  );
  useEffect(() => {
    if (isNotNil(fetchBtStrategy.data)) {
      setFormsValues(createDefaultFormValuesFromBtStrategy(fetchBtStrategy.data));
    }
  }, [fetchBtStrategy.data, setFormsValues]);

  const moveForwardToStrategyDetailsTab = (formValues: GeneralDetailsFormValues, details: GeneralDetails) => {
    const selectedSymbol = fetchSymbols.data?.find(propEq(details.symbol, 'name'));
    setSelectedSymbol(isNotNil(selectedSymbol) ? o.some(selectedSymbol) : o.none);

    setFormsValues((prev) =>
      isNotNil(selectedSymbol)
        ? {
            ...prev,
            ...formValues,
            capitalCurrency: selectedSymbol.quoteAsset,
            assetCurrency: selectedSymbol.baseAsset,
          }
        : { ...prev, ...formValues },
    );
    setGeneralDetails((prev) => (o.isNone(prev) ? o.some(details) : o.some({ ...prev.value, ...details })));

    setActiveTab(1);
  };
  const moveBackToGeneralDetailsTab = (formValues: StrategyDetailsFormValues, isFormDirty: boolean) => {
    if (isFormDirty) setFormsValues((prev) => ({ ...prev, ...formValues }));

    setActiveTab(0);
  };
  const moveForwarToBacktestResultTab = (
    formValues: StrategyDetailsFormValues,
    details: StrategyDetails & { assetCurrency: AssetCurrency },
  ) => {
    setFormsValues((prev) => ({ ...prev, ...formValues }));
    setStrategyDetails((prev) => (o.isNone(prev) ? o.some(details) : o.some({ ...prev.value, ...details })));
    handleRefetchBtStrategy();
    setActiveTab(2);
  };
  const moveBackToStrategyDetailsTab = () => setActiveTab(1);

  const [getKlinesRequest, setGetKlinesRequest] = useObjState<UseKlinesRequest | null>(null);
  const [fetchKlines, startFetchKlines] = useAutoFetch(false, useKlines, [getKlinesRequest]);
  const handleStartFetchKlines = (generalFormValues: GeneralDetails): void => {
    setGetKlinesRequest(createGetKlinesRequest(generalFormValues));
    startFetchKlines();
  };

  return (
    <article className="flex flex-col">
      <Stepper alternativeLabel activeStep={activeTab}>
        {tabs.map((label, index) => (
          <Step key={index} completed={index < activeTab}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div className="mt-4 flex flex-grow justify-center">
        {isNil(fetchSymbols.data) ? (
          <PendingFetch
            isLoading={fetchSymbols.isInitialLoading}
            error={fetchSymbols.error}
            retryFetch={handleRefetchSymbols}
          />
        ) : activeTab === 0 && isNotNil(params.btStrategyId) && isNil(fetchBtStrategy.data) ? (
          <PendingFetch
            isLoading={fetchBtStrategy.isInitialLoading}
            error={fetchBtStrategy.error}
            retryFetch={handleRefetchBtStrategy}
          />
        ) : activeTab === 0 ? (
          <GeneralDetailsTab
            symbols={fetchSymbols.data}
            formValues={formsValues}
            moveToNextTab={moveForwardToStrategyDetailsTab}
            startFetchKlines={handleStartFetchKlines}
          />
        ) : isUndefined(fetchKlines.data) ? (
          <PendingFetch
            isLoading={fetchKlines.isInitialLoading}
            error={fetchKlines.error}
            retryFetch={startFetchKlines}
          />
        ) : activeTab === 1 && o.isSome(selectedSymbol) && o.isSome(generalDetails) ? (
          <StrategyDetailsTab
            formValues={formsValues}
            selectedSymbol={selectedSymbol.value}
            klines={fetchKlines.data}
            generalDetails={generalDetails.value}
            moveToPrevTab={moveBackToGeneralDetailsTab}
            moveToNextTab={moveForwarToBacktestResultTab}
            lastExecution={lastExecution}
            setLastExecution={setLastExecution}
          />
        ) : activeTab === 2 &&
          o.isSome(lastExecution) &&
          o.isSome(generalDetails) &&
          o.isSome(strategyDetails) ? (
          <BacktestingResultTab
            btExecutionId={lastExecution.value.btExecutionId}
            klines={fetchKlines.data}
            initialCapital={strategyDetails.value.initialCapital}
            capitalCurrency={strategyDetails.value.capitalCurrency}
            assetCurrency={strategyDetails.value.assetCurrency}
            btRange={generalDetails.value.btRange}
            moveToPrevTab={moveBackToStrategyDetailsTab}
          />
        ) : undefined}
      </div>
    </article>
  );
}

function createGetKlinesRequest(data: {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxNumKlines: MaxNumKlines;
  btRange: BtRange;
}): UseKlinesRequest {
  const extendedRange = extendBtRange(data.btRange, data.timeframe, data.maxNumKlines);
  return {
    exchange: data.exchange,
    symbol: data.symbol,
    timeframe: data.timeframe,
    startTimestamp: extendedRange.start,
    endTimestamp: extendedRange.end,
  };
}

function createDefaultFormValuesFromBtStrategy(btStrategy: BtStrategy): FormsValues {
  return {
    name: btStrategy.name,
    exchange: btStrategy.exchange,
    symbol: btStrategy.symbol,
    timeframe: btStrategy.timeframe,
    maxNumKlines: numberToIntegerString(btStrategy.maxNumKlines),
    btRange: btStrategy.btRange,
    capitalCurrency: btStrategy.capitalCurrency,
    assetCurrency: btStrategy.assetCurrency,
    initialCapital: numberToDecimalString(btStrategy.initialCapital),
    takerFeeRate: numberToDecimalString(btStrategy.takerFeeRate),
    makerFeeRate: numberToDecimalString(btStrategy.makerFeeRate),
    language: btStrategy.language,
    body: btStrategy.body,
  };
}
