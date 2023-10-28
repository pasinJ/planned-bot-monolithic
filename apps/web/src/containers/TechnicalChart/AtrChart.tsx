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
import { atr } from './indicators';
import { dateToUtcTimestamp } from './utils';

export type AtrChartType = 'atr';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type AtrSettings = { period: IntegerString; color: HexColor };
const defaultSettings: AtrSettings = { period: '14' as IntegerString, color: '#B71C1C' as HexColor };
const settingFormOptions: UseFormProps<AtrSettings> = { defaultValues: defaultSettings, mode: 'onBlur' };

type AtrChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: AtrChartType) => void;
};
export const AtrChart = forwardRef<o.Option<ChartObj>, AtrChartProps>(function AtrChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset, trigger } = useForm<AtrSettings>(settingFormOptions);
  const { period, color } = getValues();

  const [atrData, setAtrData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    void atr(klines, Number(period))
      .then((atr) =>
        atr.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((atrData) => setAtrData(o.some(atrData)));
  }, [klines, period]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(atrData) ? (
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
              title="ATR"
              chartType="atr"
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
              <AtrSeries data={atrData.value} color={color} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
});

const atrSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
const AtrSeries = forwardRef<o.Option<SeriesObj>, { data: LineData[]; color: HexColor }>(
  function AtrSeries(props, ref) {
    const { data, color } = props;

    const _series = useSeriesObjRef(ref);
    const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

    const seriesOptions = useMemo(() => ({ ...atrSeriesOptions, color }), [color]);

    return (
      <Chart.Series
        ref={_series}
        type="Line"
        data={data}
        options={seriesOptions}
        crosshairMoveCb={updateLegend}
      >
        <SeriesLegendWithoutMenus name="ATR" color={seriesOptions.color} legend={legend} />
      </Chart.Series>
    );
  },
);

function SettingsForm({ control }: { control: Control<AtrSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <IntegerConfigField id="period" label="Period" name="period" control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="Atr line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
