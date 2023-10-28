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
import { UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor } from '#shared/utils/string';

import Chart, { ChartObj, SeriesObj, useChartContainer, useSeriesLegend, useSeriesObjRef } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { obv } from './indicators';
import { dateToUtcTimestamp, randomHexColor } from './utils';

export type ObvChartType = 'obv';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type ObvSettings = { color: HexColor };
const defaultSettings: ObvSettings = { color: '#2962FF' as HexColor };
const defaultSettingFormOptions: UseFormProps<ObvSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type ObvChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: ObvChartType) => void;
};
export const ObvChart = forwardRef<o.Option<ChartObj>, ObvChartProps>(function ObvChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const settingFormOptions = useMemo(
    () => mergeDeepRight(defaultSettingFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<ObvSettings>(settingFormOptions);

  const [obvData, setObvData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    void obv(klines)
      .then((obv) =>
        obv.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      )
      .then((data) => setObvData(o.some(data)));
  }, [klines]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(obvData) ? (
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
              title="OBV"
              chartType="obv"
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
              <form className="flex flex-col py-6">
                <Divider>Style</Divider>
                <div className="flex flex-col space-y-2 pt-2">
                  <ColorField label="OBV line color" labelId="line-color" name="color" control={control} />
                </div>
              </form>
            </SettingsModal>
            <div className="flex flex-col">
              <ObvSeries data={obvData.value} color={getValues().color} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
});

const obvSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
const ObvSeries = forwardRef<o.Option<SeriesObj>, { data: LineData[]; color: HexColor }>(
  function ObvSeries(props, ref) {
    const { data, color } = props;

    const _series = useSeriesObjRef(ref);
    const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

    const seriesOptions = useMemo(() => ({ ...obvSeriesOptions, color }), [color]);

    return (
      <Chart.Series
        ref={_series}
        type="Line"
        data={data}
        options={seriesOptions}
        crosshairMoveCb={updateLegend}
      >
        <SeriesLegendWithoutMenus name="OBV" color={seriesOptions.color} legend={legend} />
      </Chart.Series>
    );
  },
);
