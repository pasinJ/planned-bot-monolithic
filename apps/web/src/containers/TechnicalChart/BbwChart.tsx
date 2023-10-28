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
import { mergeDeepRight, prop } from 'ramda';
import { useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { to4Digits } from '#shared/utils/number';
import { HexColor, IntegerString } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import PeriodField from './components/PeriodField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import SourceField from './components/SourceField';
import StdDevField from './components/StdDevField';
import { bb, bbw } from './indicators';
import { Source, dateToUtcTimestamp } from './utils';

export type BbwChartType = typeof bbwChartType;
const bbwChartType = 'bbw';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type BbwSettings = { source: Source; period: IntegerString; stddev: IntegerString; color: HexColor };
const defaultSettings: BbwSettings = {
  source: 'close',
  period: '20' as IntegerString,
  stddev: '2' as IntegerString,
  color: '#138484' as HexColor,
};
const settingFormOptions: UseFormProps<BbwSettings> = { defaultValues: defaultSettings, mode: 'onBlur' };

type BbwChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: BbwChartType) => void;
};
export default function BbwChart(props: BbwChartProps) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<BbwSettings>(settingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={bbwChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="BBW"
              chartType={bbwChartType}
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
              <BbwSeries klines={klines} settings={settings} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const bbwSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type BbwSeriesProps = { klines: readonly Kline[]; settings: BbwSettings };
function BbwSeries(props: BbwSeriesProps) {
  const { klines, settings } = props;
  const { source, period, stddev, color } = settings;

  const [bbwData, setBbwData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    const sourceValue = klines.map(prop(source));
    void bb(sourceValue, Number(period), Number(stddev))
      .then((bb) => bbw(bb))
      .then((bbw) =>
        bbw.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((bbwData) => setBbwData(o.some(bbwData)));
  }, [klines, source, period, stddev]);
  const seriesOptions = useMemo(() => ({ ...bbwSeriesOptions, color }), [color]);

  return o.isNone(bbwData) ? undefined : (
    <Chart.Series id={bbwChartType} type="Line" data={bbwData.value} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="BBW" color={seriesOptions.color}>
        <Chart.SeriesValue defaultValue={bbwData.value.at(-1)?.value} formatValue={to4Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<BbwSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <SourceField control={control} />
        <PeriodField control={control} />
        <StdDevField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="BBW line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
