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

import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { ChartContainer, ChartObj } from './containers/ChartContainer';
import { Series, SeriesObj } from './containers/Series';
import useChartContainer from './hooks/useChartContainer';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { ad } from './indicators';
import { dateToUtcTimestamp } from './utils';

export type AdChartType = 'ad';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type AdSettings = { color: HexColor };
const defaultSettings: AdSettings = { color: '#999915' as HexColor };
const defaultSettingFormOptions: UseFormProps<AdSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type AdChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: AdChartType) => void;
};
export const AdChart = forwardRef<o.Option<ChartObj>, AdChartProps>(function AdChart(props, ref) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);

  const { control, getValues, reset } = useForm<AdSettings>(defaultSettingFormOptions);

  const [adData, setAdData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    void ad(klines)
      .then((ad) =>
        ad.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      )
      .then((data) => setAdData(o.some(data)));
  }, [klines]);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : o.isNone(adData) ? (
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
              title="AD"
              chartType="ad"
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
                  <ColorField label="AD line color" labelId="line-color" name="color" control={control} />
                </div>
              </form>
            </SettingsModal>
            <div className="flex flex-col">
              <AdSeries data={adData.value} color={getValues().color} />
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  );
});

const adSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
const AdSeries = forwardRef<o.Option<SeriesObj>, { data: LineData[]; color: HexColor }>(
  function AdSeries(props, ref) {
    const { data, color } = props;

    const _series = useSeriesObjRef(ref);
    const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

    const seriesOptions = useMemo(() => ({ ...adSeriesOptions, color }), [color]);

    return (
      <Series ref={_series} type="Line" data={data} options={seriesOptions} crosshairMoveCb={updateLegend}>
        <SeriesLegendWithoutMenus name="AD" color={seriesOptions.color} legend={legend} />
      </Series>
    );
  },
);
