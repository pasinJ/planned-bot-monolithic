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
import { useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { to4Digits } from '#shared/utils/number';
import { HexColor } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { wad } from './indicators';
import { dateToUtcTimestamp } from './utils';

export type WadChartType = typeof wadChartType;
const wadChartType = 'wad';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type WadSettings = { color: HexColor };
const defaultSettings: WadSettings = { color: '#4CAF50' as HexColor };
const defaultSettingFormOptions: UseFormProps<WadSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type WadChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: WadChartType) => void;
};
export default function WadChart(props: WadChartProps) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<WadSettings>(defaultSettingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={wadChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="WAD"
              chartType={wadChartType}
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
              <WadSeries klines={klines} color={settings.color} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const wadSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type WadSeriesProps = { klines: readonly Kline[]; color: HexColor };
function WadSeries(props: WadSeriesProps) {
  const { klines, color } = props;

  const [wadData, setWadData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    void wad(klines)
      .then((wad) =>
        wad.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      )
      .then((data) => setWadData(o.some(data)));
  }, [klines]);

  const seriesOptions = useMemo(() => ({ ...wadSeriesOptions, color }), [color]);

  return o.isNone(wadData) ? undefined : (
    <Chart.Series id={wadChartType} type="Line" data={wadData.value} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="WAD" color={seriesOptions.color}>
        <Chart.SeriesValue defaultValue={wadData.value.at(-1)?.value} formatValue={to4Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<WadSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="WAD line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
