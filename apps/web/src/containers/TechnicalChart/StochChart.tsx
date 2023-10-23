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
import { mergeDeepRight } from 'ramda';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { DecimalString, HexColor, IntegerString } from '#shared/utils/string';

import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import DecimalConfigField from './components/DecimalConfigField';
import IntegerConfigField from './components/IntegerConfigField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { ChartContainer, ChartObj } from './containers/ChartContainer';
import { Series, SeriesObj } from './containers/Series';
import useChartContainer from './hooks/useChartContainer';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { stoch } from './indicators';
import { dateToUtcTimestamp } from './utils';

export type StochChartType = 'stoch';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type StochSettings = {
  kPeriod: IntegerString;
  kSlow: IntegerString;
  dPeriod: IntegerString;
  upperLevel: DecimalString;
  middleLevel: DecimalString;
  lowerLevel: DecimalString;
  kLineColor: HexColor;
  dLineColor: HexColor;
  upperLineColor: HexColor;
  middleLineColor: HexColor;
  lowerLineColor: HexColor;
};
const defaultSettings: StochSettings = {
  kPeriod: '14' as IntegerString,
  kSlow: '1' as IntegerString,
  dPeriod: '3' as IntegerString,
  upperLevel: '80' as DecimalString,
  middleLevel: '50' as DecimalString,
  lowerLevel: '20' as DecimalString,
  kLineColor: '#7E57C2' as HexColor,
  dLineColor: '#FF6D00' as HexColor,
  upperLineColor: '#787B86' as HexColor,
  middleLineColor: '#787b86' as HexColor,
  lowerLineColor: '#787B86' as HexColor,
};
const defaultSettingFormOptions: UseFormProps<StochSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type StochChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: StochChartType) => void;
};
export const StochChart = forwardRef<o.Option<ChartObj>, StochChartProps>(function StochChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset } = useForm<StochSettings>(defaultSettingFormOptions);
  const { kPeriod, kSlow, dPeriod, dLineColor } = getValues();

  type StochData = { kLine: LineData[]; dLine: LineData[] };
  const [stochData, setStochData] = useState<o.Option<StochData>>(o.none);
  useEffect(() => {
    void stoch(klines, Number(kPeriod), Number(kSlow), Number(dPeriod))
      .then(({ stoch, stochMa }) => ({
        kLine: stoch.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
        dLine: stochMa.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      }))
      .then((data) => setStochData(o.some(data)));
  }, [klines, kPeriod, kSlow, dPeriod]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(stochData) ? (
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
              title="Stoch"
              chartType="stoch"
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
              <KLineSeries data={stochData.value.kLine} settings={getValues()} />
              <DLineSeries data={stochData.value.dLine} color={dLineColor} />
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  );
});

const kLineSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.kLineColor,
  lastValueVisible: false,
  priceLineVisible: false,
};
const upperLineOptions: CreatePriceLineOptions & { id: string } = {
  id: 'overbought',
  title: 'overbought',
  price: Number(defaultSettings.upperLevel),
  color: defaultSettings.upperLineColor,
  lineWidth: 2,
  lineStyle: LineStyle.Dashed,
};
const middleLineOptions: CreatePriceLineOptions & { id: string } = {
  id: 'middle',
  title: 'middle',
  price: Number(defaultSettings.middleLevel),
  color: defaultSettings.middleLevel,
  lineWidth: 2,
  lineStyle: LineStyle.Dashed,
};
const lowerLineOptions: CreatePriceLineOptions & { id: string } = {
  id: 'oversold',
  title: 'oversold',
  price: Number(defaultSettings.lowerLevel),
  color: defaultSettings.lowerLineColor,
  lineWidth: 2,
  lineStyle: LineStyle.Dashed,
};
type KLineSeriesProps = { data: LineData[]; settings: StochSettings };
const KLineSeries = forwardRef<o.Option<SeriesObj>, KLineSeriesProps>(function KLineSeries(props, ref) {
  const { data, settings } = props;
  const { kLineColor, upperLevel, upperLineColor, middleLevel, middleLineColor, lowerLevel, lowerLineColor } =
    settings;

  const _series = useSeriesObjRef(ref);
  const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

  const seriesOptions = useMemo(() => ({ ...kLineSeriesOptions, color: kLineColor }), [kLineColor]);
  const priceLinesOptions = useMemo(
    () => [
      { ...upperLineOptions, price: Number(upperLevel), color: upperLineColor },
      { ...middleLineOptions, price: Number(middleLevel), color: middleLineColor },
      { ...lowerLineOptions, price: Number(lowerLevel), color: lowerLineColor },
    ],
    [upperLevel, upperLineColor, middleLevel, middleLineColor, lowerLevel, lowerLineColor],
  );

  return (
    <Series
      ref={_series}
      type="Line"
      data={data}
      options={seriesOptions}
      priceLinesOptions={priceLinesOptions}
      crosshairMoveCb={updateLegend}
    >
      <SeriesLegendWithoutMenus name="%K" color={seriesOptions.color} legend={legend} />
    </Series>
  );
});

const dLineSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.dLineColor,
  lastValueVisible: false,
  priceLineVisible: false,
};
type DLineSeriesProps = { data: LineData[]; color: HexColor };
const DLineSeries = forwardRef<o.Option<SeriesObj>, DLineSeriesProps>(function KLineSeries(props, ref) {
  const { data, color } = props;

  const _series = useSeriesObjRef(ref);
  const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

  const seriesOptions = useMemo(() => ({ ...dLineSeriesOptions, color }), [color]);

  return (
    <Series ref={_series} type="Line" data={data} options={seriesOptions} crosshairMoveCb={updateLegend}>
      <SeriesLegendWithoutMenus name="%D" color={seriesOptions.color} legend={legend} />
    </Series>
  );
});

function SettingsForm({ control }: { control: Control<StochSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <IntegerConfigField id="k-period" label="%K Period" name="kPeriod" control={control} />
        <IntegerConfigField id="k-slow" label="%K Smoothing" name="kSlow" control={control} />
        <IntegerConfigField id="d-period" label="%D Smoothing" name="dPeriod" control={control} />
        <DecimalConfigField id="upper-level" label="Upper band" name="upperLevel" control={control} />
        <DecimalConfigField id="middle-level" label="Middle band" name="middleLevel" control={control} />
        <DecimalConfigField id="lower-level" label="Lower band" name="lowerLevel" control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="%K line color" labelId="k-line-color" name="kLineColor" control={control} />
        <ColorField label="%D line color" labelId="d-line-color" name="dLineColor" control={control} />
        <ColorField label="Upper line color" labelId="upper-color" name="upperLineColor" control={control} />
        <ColorField
          label="Middle line color"
          labelId="middle-color"
          name="middleLineColor"
          control={control}
        />
        <ColorField label="Lower line color" labelId="lower-color" name="lowerLineColor" control={control} />
      </div>
    </form>
  );
}
