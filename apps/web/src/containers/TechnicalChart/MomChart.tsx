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
import { momentum } from './indicators';
import { Source, dateToUtcTimestamp } from './utils';

export type MomChartType = 'mom';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type MomSettings = { source: Source; period: IntegerString; color: HexColor };
const defaultSettings: MomSettings = {
  source: 'close',
  period: '10' as IntegerString,
  color: '#2962FF' as HexColor,
};
const settingFormOptions: UseFormProps<MomSettings> = { defaultValues: defaultSettings, mode: 'onBlur' };

type MomChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: MomChartType) => void;
};
export const MomChart = forwardRef<o.Option<ChartObj>, MomChartProps>(function MomChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset, trigger } = useForm<MomSettings>(settingFormOptions);
  const { source, period, color } = getValues();

  const [momData, setMomData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    const sourceValue = klines.map(prop(source));
    void momentum(sourceValue, Number(period))
      .then((mom) =>
        mom.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((momData) => setMomData(o.some(momData)));
  }, [klines, source, period]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(momData) ? (
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
              title="MOM"
              chartType="mom"
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
              <MomentumSeries data={momData.value} color={color} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
});

const momSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
const MomentumSeries = forwardRef<o.Option<SeriesObj>, { data: LineData[]; color: HexColor }>(
  function MomentumSeries(props, ref) {
    const { data, color } = props;

    const _series = useSeriesObjRef(ref);
    const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

    const seriesOptions = useMemo(() => ({ ...momSeriesOptions, color }), [color]);

    return (
      <Chart.Series
        ref={_series}
        type="Line"
        data={data}
        options={seriesOptions}
        crosshairMoveCb={updateLegend}
      >
        <SeriesLegendWithoutMenus name="MOM" color={seriesOptions.color} legend={legend} />
      </Chart.Series>
    );
  },
);

function SettingsForm({ control }: { control: Control<MomSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <SourceField control={control} />
        <IntegerConfigField id="period" label="Period" name="period" control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="Momentum line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
