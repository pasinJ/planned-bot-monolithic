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
import { useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import DecimalFieldRf from '#components/DecimalFieldRf';
import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { to4Digits } from '#shared/utils/number';
import { DecimalString, HexColor, IntegerString } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import PeriodField from './components/PeriodField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { rsi } from './indicators';
import { Source, dateToUtcTimestamp } from './utils';

export type RsiChartType = typeof rsiChartType;
const rsiChartType = 'rsi';

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
export default function RsiChart(props: RsiChartProps) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<RsiSettings>(defaultSettingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={rsiChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="RSI"
              chartType={rsiChartType}
              handleOpenSettings={handleOpenSettings}
              handleRemoveChart={handleRemoveChart}
            />
            <SettingsModal
              open={settingOpen}
              onClose={handleCloseSettings}
              reset={reset}
              prevValue={settings}
              validSettings={trigger}
            >
              <SettingsForm control={control} />
            </SettingsModal>
            <div className="flex flex-col">
              <RsiSeries klines={klines} settings={settings} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

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

type RsiSeriesProps = { klines: readonly Kline[]; settings: RsiSettings };
function RsiSeries(props: RsiSeriesProps) {
  const { klines, settings } = props;
  const {
    source,
    period,
    rsiLineColor,
    overboughtLevel,
    overboughtLineColor,
    middleLevel,
    middleLineColor,
    oversoldLevel,
    oversoldLineColor,
  } = settings;

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

  const seriesOptions = useMemo(() => ({ ...rsiSeriesOptions, color: rsiLineColor }), [rsiLineColor]);
  const priceLinesOptions = useMemo(
    () => [
      { ...overboughtPriceLineOptions, price: Number(overboughtLevel), color: overboughtLineColor },
      { ...middlePriceLineOptions, price: Number(middleLevel), color: middleLineColor },
      { ...oversoldPriceLineOptions, price: Number(oversoldLevel), color: oversoldLineColor },
    ],
    [overboughtLevel, overboughtLineColor, middleLevel, middleLineColor, oversoldLevel, oversoldLineColor],
  );

  return o.isNone(rsiData) ? undefined : (
    <Chart.Series
      id={rsiChartType}
      type="Line"
      data={rsiData.value}
      options={seriesOptions}
      priceLinesOptions={priceLinesOptions}
    >
      <SeriesLegendWithoutMenus name="RSI" color={seriesOptions.color}>
        <Chart.SeriesValue defaultValue={rsiData.value.at(-1)?.value} formatValue={to4Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<RsiSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <PeriodField control={control} />
        <DecimalFieldRf
          controllerProps={{
            control,
            name: 'overboughtLevel',
            rules: { required: `Overbought level is required` },
          }}
          fieldProps={{ id: 'overbought-level', label: 'Overbought', required: true }}
        />
        <DecimalFieldRf
          controllerProps={{
            control,
            name: 'middleLevel',
            rules: { required: `Middle level is required` },
          }}
          fieldProps={{ id: 'middle-level', label: 'Middle', required: true }}
        />
        <DecimalFieldRf
          controllerProps={{
            control,
            name: 'oversoldLevel',
            rules: { required: `Oversold level is required` },
          }}
          fieldProps={{ id: 'oversold-level', label: 'Oversold', required: true }}
        />
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
