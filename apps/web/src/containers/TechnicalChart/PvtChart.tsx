import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import {
  DeepPartial,
  LineData,
  LineStyleOptions,
  LogicalRangeChangeEventHandler,
  MouseEventHandler,
  SeriesOptionsCommon,
  Time,
  TimeChartOptions,
} from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import { useMemo } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { pvt } from './indicators';
import { dateToUtcTimestamp, formatValue, randomHexColor } from './utils';

export type PvtChartType = typeof pvtChartType;
const pvtChartType = 'pvt';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type PvtSettings = { color: HexColor };
const defaultSettings: PvtSettings = { color: '#2962FF' as HexColor };
const defaultSettingFormOptions: UseFormProps<PvtSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type PvtChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: PvtChartType) => void;
  maxDecimalDigits?: number;
};
export default function PvtChart(props: PvtChartProps) {
  const { klines, options, maxDecimalDigits, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } =
    props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const settingFormOptions = useMemo(
    () => mergeDeepRight(defaultSettingFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<PvtSettings>(settingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={pvtChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="PVT"
              chartType={pvtChartType}
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
              <PvtSeries klines={klines} color={settings.color} maxDecimalDigits={maxDecimalDigits} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const pvtSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type PvtSeriesProps = { klines: readonly Kline[]; color: HexColor; maxDecimalDigits?: number };
function PvtSeries(props: PvtSeriesProps) {
  const { klines, color, maxDecimalDigits } = props;

  const pvtData = useMemo<LineData[]>(
    () =>
      pvt(klines).map((value, index) => ({
        time: dateToUtcTimestamp(klines[index].openTimestamp),
        value,
      })),
    [klines],
  );

  const seriesOptions = useMemo(() => ({ ...pvtSeriesOptions, color }), [color]);

  return (
    <Chart.Series id={pvtChartType} type="Line" data={pvtData} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="PVT" color={seriesOptions.color}>
        <Chart.SeriesValue
          defaultValue={pvtData.at(-1)?.value}
          formatValue={formatValue(4, maxDecimalDigits)}
        />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<PvtSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="PVT line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
