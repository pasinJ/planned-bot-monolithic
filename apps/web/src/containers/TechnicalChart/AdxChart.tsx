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
import { to2Digits } from '#shared/utils/number';
import { HexColor, IntegerString } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import PeriodField from './components/PeriodField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { adx } from './indicators';
import { dateToUtcTimestamp } from './utils';

export type AdxChartType = typeof adxChartType;
const adxChartType = 'adx';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type AdxSettings = { period: IntegerString; color: HexColor };
const defaultSettings: AdxSettings = { period: '14' as IntegerString, color: '#FF5252' as HexColor };
const settingFormOptions: UseFormProps<AdxSettings> = { defaultValues: defaultSettings, mode: 'onBlur' };

type AdxChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: AdxChartType) => void;
};
export default function AdxChart(props: AdxChartProps) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<AdxSettings>(settingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={adxChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="ADX"
              chartType={adxChartType}
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
              <AdxSeries klines={klines} settings={settings} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const adxSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type AdxSeriesProps = { klines: readonly Kline[]; settings: AdxSettings };
function AdxSeries(props: AdxSeriesProps) {
  const {
    klines,
    settings: { color, period },
  } = props;

  const [adxData, setAdxData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    void adx(klines, Number(period))
      .then((adx) =>
        adx.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((data) => setAdxData(o.some(data)));
  }, [klines, period]);

  const seriesOptions = useMemo(() => ({ ...adxSeriesOptions, color }), [color]);

  return o.isNone(adxData) ? undefined : (
    <Chart.Series id={adxChartType} type="Line" data={adxData.value} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="ADX" color={seriesOptions.color}>
        <Chart.SeriesValue defaultValue={adxData.value.at(-1)?.value} formatValue={to2Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<AdxSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <PeriodField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="Adx line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
