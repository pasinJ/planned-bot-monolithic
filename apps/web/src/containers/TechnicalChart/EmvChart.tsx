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
import { emv } from 'src/containers/TechnicalChart/indicators';

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
import { dateToUtcTimestamp } from './utils';

export type EmvChartType = 'emv';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type EmvSettings = { color: HexColor };
const defaultSettings: EmvSettings = { color: '#43A047' as HexColor };
const defaultSettingFormOptions: UseFormProps<EmvSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type EmvChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: EmvChartType) => void;
};
export const EmvChart = forwardRef<o.Option<ChartObj>, EmvChartProps>(function EmvChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset } = useForm<EmvSettings>(defaultSettingFormOptions);

  const [emvData, setEmvData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    void emv(klines)
      .then((emv) =>
        emv.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      )
      .then((data) => setEmvData(o.some(data)));
  }, [klines]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(emvData) ? (
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
              title="EMV"
              chartType="emv"
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
                  <ColorField label="EMV line color" labelId="line-color" name="color" control={control} />
                </div>
              </form>
            </SettingsModal>
            <div className="flex flex-col">
              <EmvSeries data={emvData.value} color={getValues().color} />
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  );
});

const emvSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
const EmvSeries = forwardRef<o.Option<SeriesObj>, { data: LineData[]; color: HexColor }>(
  function EmvSeries(props, ref) {
    const { data, color } = props;

    const _series = useSeriesObjRef(ref);
    const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

    const seriesOptions = useMemo(() => ({ ...emvSeriesOptions, color }), [color]);

    return (
      <Series ref={_series} type="Line" data={data} options={seriesOptions} crosshairMoveCb={updateLegend}>
        <SeriesLegendWithoutMenus name="EMV" color={seriesOptions.color} legend={legend} />
      </Series>
    );
  },
);
