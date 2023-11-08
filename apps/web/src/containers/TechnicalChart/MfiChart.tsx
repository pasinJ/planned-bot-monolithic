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
import { useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import DecimalFieldRf from '#components/DecimalFieldRf';
import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { DecimalString, HexColor, IntegerString } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import PeriodField from './components/PeriodField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { mfi } from './indicators';
import { dateToUtcTimestamp, formatValue } from './utils';

export type MfiChartType = typeof mfiChartType;
const mfiChartType = 'mfi';

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
  maxDecimalDigits?: number;
};
export default function MfiChart(props: MfiChartProps) {
  const { klines, options, maxDecimalDigits, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } =
    props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<MfiSettings>(defaultSettingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={mfiChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="MFI"
              chartType={mfiChartType}
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
              <MfiSeries klines={klines} settings={settings} maxDecimalDigits={maxDecimalDigits} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

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

type MfiSeriesProps = { klines: readonly Kline[]; settings: MfiSettings; maxDecimalDigits?: number };
function MfiSeries(props: MfiSeriesProps) {
  const { klines, settings, maxDecimalDigits } = props;
  const {
    period,
    mfiLineColor,
    overboughtLevel,
    overboughtLineColor,
    middleLevel,
    middleLineColor,
    oversoldLevel,
    oversoldLineColor,
  } = settings;

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

  const seriesOptions = useMemo(() => ({ ...mfiSeriesOptions, color: mfiLineColor }), [mfiLineColor]);
  const priceLinesOptions = useMemo(
    () => [
      { ...overboughtPriceLineOptions, price: Number(overboughtLevel), color: overboughtLineColor },
      { ...middlePriceLineOptions, price: Number(middleLevel), color: middleLineColor },
      { ...oversoldPriceLineOptions, price: Number(oversoldLevel), color: oversoldLineColor },
    ],
    [overboughtLevel, overboughtLineColor, middleLevel, middleLineColor, oversoldLevel, oversoldLineColor],
  );

  return o.isNone(mfiData) ? undefined : (
    <Chart.Series
      id={mfiChartType}
      type="Line"
      data={mfiData.value}
      options={seriesOptions}
      priceLinesOptions={priceLinesOptions}
    >
      <SeriesLegendWithoutMenus name="MFI" color={seriesOptions.color}>
        <Chart.SeriesValue
          defaultValue={mfiData.value.at(-1)?.value}
          formatValue={formatValue(4, maxDecimalDigits)}
        />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<MfiSettings> }) {
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
