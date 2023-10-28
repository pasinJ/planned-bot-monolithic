import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import {
  CreatePriceLineOptions,
  DeepPartial,
  LineData,
  LineStyle,
  LineStyleOptions,
  LogicalRangeChangeEventHandler,
  MouseEventHandler,
  SeriesOptionsCommon,
  Time,
  TimeChartOptions,
} from 'lightweight-charts';
import { mergeDeepRight, prop } from 'ramda';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { DecimalString, HexColor, IntegerString } from '#shared/utils/string';

import Chart, { ChartObj, SeriesObj, useChartContainer, useSeriesLegend, useSeriesObjRef } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import DecimalConfigField from './components/DecimalConfigField';
import IntegerConfigField from './components/IntegerConfigField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { rsi } from './indicators';
import { Source, dateToUtcTimestamp } from './utils';

export type RsiChartType = 'rsi';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type RsiSettings = {
  source: Source;
  period: IntegerString;
  overboughtLevel: DecimalString;
  middleLevel: DecimalString;
  oversoldLevel: DecimalString;
  rsiLineColor: HexColor;
  overboughtLineColor: HexColor;
  middleLineColor: HexColor;
  oversoldLineColor: HexColor;
};
const defaultSettings: RsiSettings = {
  source: 'close',
  period: '14' as IntegerString,
  overboughtLevel: '70' as DecimalString,
  middleLevel: '50' as DecimalString,
  oversoldLevel: '30' as DecimalString,
  rsiLineColor: '#7E57C2' as HexColor,
  overboughtLineColor: '#787B86' as HexColor,
  middleLineColor: '#787B86' as HexColor,
  oversoldLineColor: '#787B86' as HexColor,
};
const defaultSettingFormOptions: UseFormProps<RsiSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type RsiChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: RsiChartType) => void;
};
export const RsiChart = forwardRef<o.Option<ChartObj>, RsiChartProps>(function RsiChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset, trigger } = useForm<RsiSettings>(defaultSettingFormOptions);
  const { source, period } = getValues();

  const [rsiData, setRsiData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    const sourceValue = klines.map(prop(source));
    void rsi(sourceValue, Number(period))
      .then((rsi) =>
        rsi.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      )
      .then((data) => setRsiData(o.some(data)));
  }, [klines, source, period]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(rsiData) ? (
        <div>Loading...</div>
      ) : (
        <Chart.Container
          ref={ref}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="RSI"
              chartType="rsi"
              handleOpenSettings={handleOpenSettings}
              handleRemoveChart={handleRemoveChart}
            />
            <SettingsModal
              open={settingOpen}
              onClose={handleCloseSettings}
              reset={reset}
              prevValue={getValues()}
              validSettings={trigger}
            >
              <SettingsForm control={control} />
            </SettingsModal>
            <div className="flex flex-col">
              <RsiSeries data={rsiData.value} settings={getValues()} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
});

const rsiSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.rsiLineColor,
  lastValueVisible: false,
  priceLineVisible: false,
};
const overboughtPriceLineOptions: CreatePriceLineOptions & { id: string } = {
  id: 'overbought',
  title: 'overbought',
  price: Number(defaultSettings.overboughtLevel),
  color: defaultSettings.overboughtLineColor,
  lineWidth: 2,
  lineStyle: LineStyle.Dashed,
};
const middlePriceLineOptions: CreatePriceLineOptions & { id: string } = {
  id: 'middle',
  title: 'middle',
  price: Number(defaultSettings.middleLevel),
  color: defaultSettings.middleLevel,
  lineWidth: 2,
  lineStyle: LineStyle.Dashed,
};
const oversoldPriceLineOptions: CreatePriceLineOptions & { id: string } = {
  id: 'oversold',
  title: 'oversold',
  price: Number(defaultSettings.oversoldLevel),
  color: defaultSettings.oversoldLineColor,
  lineWidth: 2,
  lineStyle: LineStyle.Dashed,
};

type RsiSeriesProps = { data: LineData[]; settings: RsiSettings };
const RsiSeries = forwardRef<o.Option<SeriesObj>, RsiSeriesProps>(function RsiSeries(props, ref) {
  const { data, settings } = props;
  const {
    rsiLineColor,
    overboughtLevel,
    overboughtLineColor,
    middleLevel,
    middleLineColor,
    oversoldLevel,
    oversoldLineColor,
  } = settings;

  const _series = useSeriesObjRef(ref);
  const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

  const seriesOptions = useMemo(() => ({ ...rsiSeriesOptions, color: rsiLineColor }), [rsiLineColor]);
  const priceLinesOptions = useMemo(
    () => [
      { ...overboughtPriceLineOptions, price: Number(overboughtLevel), color: overboughtLineColor },
      { ...middlePriceLineOptions, price: Number(middleLevel), color: middleLineColor },
      { ...oversoldPriceLineOptions, price: Number(oversoldLevel), color: oversoldLineColor },
    ],
    [overboughtLevel, overboughtLineColor, middleLevel, middleLineColor, oversoldLevel, oversoldLineColor],
  );

  return (
    <Chart.Series
      ref={_series}
      type="Line"
      data={data}
      options={seriesOptions}
      priceLinesOptions={priceLinesOptions}
      crosshairMoveCb={updateLegend}
    >
      <SeriesLegendWithoutMenus name="RSI" color={seriesOptions.color} legend={legend} />
    </Chart.Series>
  );
});

function SettingsForm({ control }: { control: Control<RsiSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <IntegerConfigField id="period" label="Period" name="period" control={control} />
        <DecimalConfigField
          id="overbought-level"
          label="Overbought"
          name="overboughtLevel"
          control={control}
        />
        <DecimalConfigField id="middle-level" label="Middle" name="middleLevel" control={control} />
        <DecimalConfigField id="oversold-level" label="Oversold" name="oversoldLevel" control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="RSI line color" labelId="rsi-color" name="rsiLineColor" control={control} />
        <ColorField
          label="Overbought line color"
          labelId="overbought-color"
          name="overboughtLineColor"
          control={control}
        />
        <ColorField
          label="Middle line color"
          labelId="middle-color"
          name="middleLineColor"
          control={control}
        />
        <ColorField
          label="Oversold line color"
          labelId="oversold-color"
          name="oversoldLineColor"
          control={control}
        />
      </div>
    </form>
  );
}
