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
import { to4Digits } from '#shared/utils/number';
import { HexColor, IntegerString } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import PeriodField from './components/PeriodField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import { atr } from './indicators';
import { dateToUtcTimestamp } from './utils';

export type AtrChartType = typeof atrChartType;
const atrChartType = 'atr';

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
export default function AtrChart(props: AtrChartProps) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<AtrSettings>(settingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={atrChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="ATR"
              chartType={atrChartType}
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
              <AtrSeries klines={klines} settings={settings} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const atrSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type AtrSeriesProps = { klines: readonly Kline[]; settings: AtrSettings };
function AtrSeries(props: AtrSeriesProps) {
  const {
    klines,
    settings: { color, period },
  } = props;

  const [atrData, setAtrData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    void atr(klines, Number(period))
      .then((atr) =>
        atr.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((atrData) => setAtrData(o.some(atrData)));
  }, [klines, period]);

  const seriesOptions = useMemo(() => ({ ...atrSeriesOptions, color }), [color]);

  return o.isNone(atrData) ? undefined : (
    <Chart.Series id={atrChartType} type="Line" data={atrData.value} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="ATR" color={seriesOptions.color}>
        <Chart.SeriesValue defaultValue={atrData.value.at(-1)?.value} formatValue={to4Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<AtrSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <PeriodField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="Atr line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
