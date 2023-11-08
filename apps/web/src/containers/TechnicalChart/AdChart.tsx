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
import { HexColor } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { ad } from './indicators';
import { dateToUtcTimestamp, formatValue } from './utils';

export type AdChartType = typeof adChartType;
const adChartType = 'ad';

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
  maxDecimalDigits?: number;
};
export default function AdChart(props: AdChartProps) {
  const { klines, options, maxDecimalDigits, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } =
    props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<AdSettings>(defaultSettingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={adChartType}
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
              prevValue={settings}
              validSettings={trigger}
            >
              <SettingForm control={control} />
            </SettingsModal>
            <div className="flex flex-col">
              <AdSeries klines={klines} color={settings.color} maxDecimalDigits={maxDecimalDigits} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const adSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type AdSeriesProps = { klines: readonly Kline[]; color: HexColor; maxDecimalDigits?: number };
function AdSeries(props: AdSeriesProps) {
  const { klines, color, maxDecimalDigits } = props;

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

  const seriesOptions = useMemo(() => ({ ...adSeriesOptions, color }), [color]);

  return o.isNone(adData) ? undefined : (
    <Chart.Series id={adChartType} type="Line" data={adData.value} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="AD" color={seriesOptions.color}>
        <Chart.SeriesValue
          defaultValue={adData.value.at(-1)?.value}
          formatValue={formatValue(2, maxDecimalDigits)}
        />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingForm({ control }: { control: Control<AdSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="AD line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
