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
import { mfi } from './indicators';
import { dateToUtcTimestamp } from './utils';

export type MfiChartType = 'mfi';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type MfiSettings = {
  period: IntegerString;
  overboughtLevel: DecimalString;
  middleLevel: DecimalString;
  oversoldLevel: DecimalString;
  mfiLineColor: HexColor;
  overboughtLineColor: HexColor;
  middleLineColor: HexColor;
  oversoldLineColor: HexColor;
};
const defaultSettings: MfiSettings = {
  period: '14' as IntegerString,
  overboughtLevel: '80' as DecimalString,
  middleLevel: '50' as DecimalString,
  oversoldLevel: '20' as DecimalString,
  mfiLineColor: '#7E57C2' as HexColor,
  overboughtLineColor: '#787B86' as HexColor,
  middleLineColor: '#787b86' as HexColor,
  oversoldLineColor: '#787B86' as HexColor,
};
const defaultSettingFormOptions: UseFormProps<MfiSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type MfiChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: MfiChartType) => void;
};
export const MfiChart = forwardRef<o.Option<ChartObj>, MfiChartProps>(function MfiChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset } = useForm<MfiSettings>(defaultSettingFormOptions);
  const { period } = getValues();

  const [mfiData, setMfiData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    void mfi(klines, Number(period))
      .then((mfi) =>
        mfi.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      )
      .then((data) => setMfiData(o.some(data)));
  }, [klines, period]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(mfiData) ? (
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
              title="MFI"
              chartType="mfi"
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
              <MfiSeries data={mfiData.value} settings={getValues()} />
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  );
});

const mfiSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.mfiLineColor,
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

type MfiSeriesProps = { data: LineData[]; settings: MfiSettings };
const MfiSeries = forwardRef<o.Option<SeriesObj>, MfiSeriesProps>(function MfiSeries(props, ref) {
  const { data, settings } = props;
  const {
    mfiLineColor,
    overboughtLevel,
    overboughtLineColor,
    middleLevel,
    middleLineColor,
    oversoldLevel,
    oversoldLineColor,
  } = settings;

  const _series = useSeriesObjRef(ref);
  const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

  const seriesOptions = useMemo(() => ({ ...mfiSeriesOptions, color: mfiLineColor }), [mfiLineColor]);
  const priceLinesOptions = useMemo(
    () => [
      { ...overboughtPriceLineOptions, price: Number(overboughtLevel), color: overboughtLineColor },
      { ...middlePriceLineOptions, price: Number(middleLevel), color: middleLineColor },
      { ...oversoldPriceLineOptions, price: Number(oversoldLevel), color: oversoldLineColor },
    ],
    [overboughtLevel, overboughtLineColor, middleLevel, middleLineColor, oversoldLevel, oversoldLineColor],
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
      <SeriesLegendWithoutMenus name="MFI" color={seriesOptions.color} legend={legend} />
    </Series>
  );
});

function SettingsForm({ control }: { control: Control<MfiSettings> }) {
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
        <ColorField label="MFI line color" labelId="mfi-color" name="mfiLineColor" control={control} />
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
