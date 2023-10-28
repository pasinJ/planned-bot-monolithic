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
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor, IntegerString } from '#shared/utils/string';

import Chart, { ChartObj, SeriesObj, useChartContainer, useSeriesLegend, useSeriesObjRef } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import IntegerConfigField from './components/IntegerConfigField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import SourceField from './components/SourceField';
import { bb, bbw } from './indicators';
import { Source, dateToUtcTimestamp } from './utils';

export type BbwChartType = 'bbw';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type BbwSettings = {
  source: Source;
  period: IntegerString;
  stddev: IntegerString;
  color: HexColor;
};
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
export const BbwChart = forwardRef<o.Option<ChartObj>, BbwChartProps>(function BbwChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset, trigger } = useForm<BbwSettings>(settingFormOptions);
  const { source, period, stddev, color } = getValues();

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

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(bbwData) ? (
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
              title="BBW"
              chartType="bbw"
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
              <BbwSeries data={bbwData.value} color={color} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
});

const bbwSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
const BbwSeries = forwardRef<o.Option<SeriesObj>, { data: LineData[]; color: HexColor }>(
  function BbwSeries(props, ref) {
    const { data, color } = props;

    const _series = useSeriesObjRef(ref);
    const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

    const seriesOptions = useMemo(() => ({ ...bbwSeriesOptions, color }), [color]);

    return (
      <Chart.Series
        ref={_series}
        type="Line"
        data={data}
        options={seriesOptions}
        crosshairMoveCb={updateLegend}
      >
        <SeriesLegendWithoutMenus name="BBW" color={seriesOptions.color} legend={legend} />
      </Chart.Series>
    );
  },
);

function SettingsForm({ control }: { control: Control<BbwSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <SourceField control={control} />
        <IntegerConfigField id="period" label="Period" name="period" control={control} />
        <IntegerConfigField id="stddev" label="StdDev" name="stddev" control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="BBW line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
