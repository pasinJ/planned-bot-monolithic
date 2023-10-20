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
import { forwardRef, useMemo } from 'react';
import { UseFormProps, useForm } from 'react-hook-form';
import { pvt } from 'src/containers/TechnicalChart/indicators';

import { Kline } from '#features/klines/kline';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor } from '#shared/utils/string';

import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { ChartContainer, ChartObj } from './containers/ChartContainer';
import { Series, SeriesObj } from './containers/Series';
import useChartContainer from './hooks/useChartContainer';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { dateToUtcTimestamp, randomHexColor } from './utils';

export type PvtChartType = 'pvt';

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
};
export const PvtChart = forwardRef<o.Option<ChartObj>, PvtChartProps>(function PvtChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const settingFormOptions = useMemo(
    () => mergeDeepRight(defaultSettingFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset } = useForm<PvtSettings>(settingFormOptions);

  const pvtData: LineData[] = useMemo(
    () =>
      pvt(klines).map((value, index) => ({
        time: dateToUtcTimestamp(klines[index].openTimestamp),
        value,
      })),
    [klines],
  );

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <ChartContainer
          ref={ref}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="PVT"
              chartType="pvt"
              handleOpenSettings={handleOpenSettings}
              handleRemoveChart={handleRemoveChart}
            />
            <SettingsModal
              open={settingOpen}
              onClose={handleCloseSettings}
              reset={reset}
              prevValue={getValues()}
            >
              <form className="flex flex-col py-6">
                <Divider>Style</Divider>
                <div className="flex flex-col space-y-2 pt-2">
                  <ColorField label="PVT line color" labelId="line-color" name="color" control={control} />
                </div>
              </form>
            </SettingsModal>
            <div className="flex flex-col">
              <PvtSeries data={pvtData} options={getValues()} />
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  );
});

const pvtSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  color: defaultSettings.color,
  lineWidth: 2,
};
const PvtSeries = forwardRef<
  o.Option<SeriesObj>,
  { data: LineData[]; options: DeepPartial<LineStyleOptions & SeriesOptionsCommon> }
>(function PvtSeries(props, ref) {
  const { data, options } = props;

  const _series = useSeriesObjRef(ref);
  const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

  const seriesOptions = mergeDeepRight(pvtSeriesOptions, options);

  return (
    <Series ref={_series} type="Line" data={data} options={seriesOptions} crosshairMoveCb={updateLegend}>
      <SeriesLegendWithoutMenus name="PVT" color={seriesOptions.color} legend={legend} />
    </Series>
  );
});
