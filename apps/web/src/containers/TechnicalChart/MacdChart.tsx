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
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor, IntegerString } from '#shared/utils/string';

import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import IntegerConfigField from './components/IntegerConfigField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import SourceField from './components/SourceField';
import { ChartContainer, ChartObj } from './containers/ChartContainer';
import { Series, SeriesObj } from './containers/Series';
import useChartContainer from './hooks/useChartContainer';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { macd } from './indicators';
import { Source, dateToUtcTimestamp, downColor, upColor } from './utils';

export type MacdChartType = 'macd';

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
export const MacdChart = forwardRef<o.Option<ChartObj>, MacdChartProps>(function MacdChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset } = useForm<MacdSettings>(settingFormOptions);
  const {
    source,
    shortPeriod,
    longPeriod,
    signalPeriod,
    macdLineColor,
    signalLineColor,
    histogramPositiveColor,
    histogramNegativeColor,
  } = getValues();

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
  const transformedMacdData = useMemo(() => {
    if (o.isNone(macdData)) return macdData;

    return o.some({
      ...macdData.value,
      histogram: macdData.value.histogram.map((data) => ({
        ...data,
        color: data.value >= 0 ? histogramPositiveColor : histogramNegativeColor,
      })),
    });
  }, [macdData, histogramPositiveColor, histogramNegativeColor]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(transformedMacdData) ? (
        <div>Loading...</div>
      ) : (
        <ChartContainer
          ref={ref}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="MACD"
              chartType="macd"
              handleOpenSettings={handleOpenSettings}
              handleRemoveChart={handleRemoveChart}
            />
            <SettingsModal
              open={settingOpen}
              onClose={handleCloseSettings}
              reset={reset}
              prevValue={getValues()}
            >
              <SettingsForm control={control} />
            </SettingsModal>
            <div className="flex flex-col">
              <MacdSeries data={transformedMacdData.value.macd} color={macdLineColor} />
              <SignalSeries data={transformedMacdData.value.signal} color={signalLineColor} />
              <HistogramSeries data={transformedMacdData.value.histogram} />
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  );
});

const macdSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.macdLineColor,
  lastValueVisible: false,
  priceLineVisible: false,
};
const MacdSeries = forwardRef<o.Option<SeriesObj>, { data: LineData[]; color: HexColor }>(
  function MacdSeries(props, ref) {
    const { data, color } = props;

    const _series = useSeriesObjRef(ref);
    const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

    const seriesOptions = useMemo(() => ({ ...macdSeriesOptions, color }), [color]);

    return (
      <Series ref={_series} type="Line" data={data} options={seriesOptions} crosshairMoveCb={updateLegend}>
        <SeriesLegendWithoutMenus name="MACD" color={seriesOptions.color} legend={legend} />
      </Series>
    );
  },
);

const signalSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.signalLineColor,
  lastValueVisible: false,
  priceLineVisible: false,
};
const SignalSeries = forwardRef<o.Option<SeriesObj>, { data: LineData[]; color: HexColor }>(
  function SignalSeries(props, ref) {
    const { data, color } = props;

    const _series = useSeriesObjRef(ref);
    const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

    const seriesOptions = useMemo(() => ({ ...signalSeriesOptions, color }), [color]);

    return (
      <Series ref={_series} type="Line" data={data} options={seriesOptions} crosshairMoveCb={updateLegend}>
        <SeriesLegendWithoutMenus name="SIGNAL" color={seriesOptions.color} legend={legend} />
      </Series>
    );
  },
);

const histogramSeriesOptions: DeepPartial<HistogramStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
};
const HistogramSeries = forwardRef<o.Option<SeriesObj>, { data: HistogramData[] }>(function HistogramSeries(
  { data },
  ref,
) {
  const _series = useSeriesObjRef(ref);
  const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

  return (
    <Series
      ref={_series}
      type="Histogram"
      data={data}
      options={histogramSeriesOptions}
      crosshairMoveCb={updateLegend}
    >
      <SeriesLegendWithoutMenus name="HISTOGRAM" color="#696969" legend={legend} />
    </Series>
  );
});

function SettingsForm({ control }: { control: Control<MacdSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <SourceField control={control} />
        <IntegerConfigField id="short-period" label="Short period" name="shortPeriod" control={control} />
        <IntegerConfigField id="long-period" label="Long period" name="longPeriod" control={control} />
        <IntegerConfigField id="signal-period" label="Signal period" name="signalPeriod" control={control} />
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
