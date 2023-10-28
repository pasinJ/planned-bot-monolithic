import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as o from 'fp-ts/lib/Option';
import {
  DeepPartial,
  HistogramData,
  HistogramStyleOptions,
  LineData,
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

import IntegerFieldRf from '#components/IntegerFieldRf';
import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { to4Digits } from '#shared/utils/number';
import { HexColor, IntegerString } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import SourceField from './components/SourceField';
import { macd } from './indicators';
import { Source, dateToUtcTimestamp, downColor, upColor } from './utils';

export type MacdChartType = typeof macdChartType;
const macdChartType = 'macd';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type MacdSettings = {
  source: Source;
  shortPeriod: IntegerString;
  longPeriod: IntegerString;
  signalPeriod: IntegerString;
  macdLineColor: HexColor;
  signalLineColor: HexColor;
  histogramPositiveColor: HexColor;
  histogramNegativeColor: HexColor;
};
const defaultSettings: MacdSettings = {
  source: 'close',
  shortPeriod: '12' as IntegerString,
  longPeriod: '26' as IntegerString,
  signalPeriod: '9' as IntegerString,
  macdLineColor: '#2962FF' as HexColor,
  signalLineColor: '#FF6D00' as HexColor,
  histogramPositiveColor: upColor,
  histogramNegativeColor: downColor,
};
const settingFormOptions: UseFormProps<MacdSettings> = { defaultValues: defaultSettings, mode: 'onBlur' };

type MacdChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: MacdChartType) => void;
};
export default function MacdChart(props: MacdChartProps) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<MacdSettings>(settingFormOptions);
  const settings = getValues();

  const macdData = useMacdData(klines, settings);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={macdChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="MACD"
              chartType={macdChartType}
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
            {o.isNone(macdData) ? undefined : (
              <div className="flex flex-col">
                <MacdSeries data={macdData.value.macd} color={settings.macdLineColor} />
                <SignalSeries data={macdData.value.signal} color={settings.signalLineColor} />
                <HistogramSeries data={macdData.value.histogram} />
              </div>
            )}
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

function useMacdData(klines: readonly Kline[], settings: MacdSettings) {
  const { source, shortPeriod, longPeriod, signalPeriod, histogramPositiveColor, histogramNegativeColor } =
    settings;

  type MacdData = { macd: LineData[]; signal: LineData[]; histogram: HistogramData[] };
  const [macdData, setMacdData] = useState<o.Option<MacdData>>(o.none);
  useEffect(() => {
    const sourceValue = klines.map(prop(source));
    void macd(sourceValue, Number(shortPeriod), Number(longPeriod), Number(signalPeriod))
      .then(({ macd, signal, histogram }) => ({
        macd: macd.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
        signal: signal.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
        histogram: histogram.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      }))
      .then((macdData) => setMacdData(o.some(macdData)));
  }, [klines, source, shortPeriod, longPeriod, signalPeriod]);

  const styledMacdData = useMemo(() => {
    if (o.isNone(macdData)) return macdData;

    return o.some({
      ...macdData.value,
      histogram: macdData.value.histogram.map((data) => ({
        ...data,
        color: data.value >= 0 ? histogramPositiveColor : histogramNegativeColor,
      })),
    });
  }, [macdData, histogramPositiveColor, histogramNegativeColor]);

  return styledMacdData;
}

const macdSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.macdLineColor,
  lastValueVisible: false,
  priceLineVisible: false,
};
type MacdSeriesProps = { data: LineData[]; color: HexColor };
function MacdSeries(props: MacdSeriesProps) {
  const { data, color } = props;

  const seriesOptions = useMemo(() => ({ ...macdSeriesOptions, color }), [color]);

  return (
    <Chart.Series id="macd" type="Line" data={data} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="MACD" color={seriesOptions.color}>
        <Chart.SeriesValue defaultValue={data.at(-1)?.value} formatValue={to4Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

const signalSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.signalLineColor,
  lastValueVisible: false,
  priceLineVisible: false,
};
type SignalSeriesProps = { data: LineData[]; color: HexColor };
function SignalSeries(props: SignalSeriesProps) {
  const { data, color } = props;

  const seriesOptions = useMemo(() => ({ ...signalSeriesOptions, color }), [color]);

  return (
    <Chart.Series id="signal" type="Line" data={data} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="SIGNAL" color={seriesOptions.color}>
        <Chart.SeriesValue defaultValue={data.at(-1)?.value} formatValue={to4Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

const histogramSeriesOptions: DeepPartial<HistogramStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
};
type HistogramSeriesProps = { data: HistogramData[] };
function HistogramSeries({ data }: HistogramSeriesProps) {
  return (
    <Chart.Series id="histogram" type="Histogram" data={data} options={histogramSeriesOptions}>
      <SeriesLegendWithoutMenus name="HISTOGRAM" color="#696969">
        <Chart.SeriesValue defaultValue={data.at(-1)?.value} formatValue={to4Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<MacdSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <SourceField control={control} />
        <IntegerFieldRf
          controllerProps={{ control, name: 'shortPeriod', rules: { required: 'Short period is required' } }}
          fieldProps={{ id: 'short-period', label: 'Short period', required: true }}
        />
        <IntegerFieldRf
          controllerProps={{ control, name: 'longPeriod', rules: { required: 'Long period is required' } }}
          fieldProps={{ id: 'long-period', label: 'Long period', required: true }}
        />
        <IntegerFieldRf
          controllerProps={{
            control,
            name: 'signalPeriod',
            rules: { required: 'Signal period is required' },
          }}
          fieldProps={{ id: 'signal-period', label: 'Signal period', required: true }}
        />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="MACD line color" labelId="macd-color" name="macdLineColor" control={control} />
        <ColorField
          label="Signal line color"
          labelId="signal-color"
          name="signalLineColor"
          control={control}
        />
        <div className="flex flex-col space-y-2">
          <Typography variant="body2" className="font-medium underline">
            Histogram
          </Typography>
          <div className="flex flex-col space-y-2 pl-4">
            <ColorField
              label="Positive color"
              labelId="histogram-positive-color"
              name="histogramPositiveColor"
              control={control}
            />
            <ColorField
              label="Negative color"
              labelId="histogram-negative-color"
              name="histogramNegativeColor"
              control={control}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
