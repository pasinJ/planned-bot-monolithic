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
import SourceField from './components/SourceField';
import { momentum } from './indicators';
import { Source, dateToUtcTimestamp } from './utils';

export type MomChartType = typeof momChartType;
const momChartType = 'mom';

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
export default function MomChart(props: MomChartProps) {
  const { klines, options, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } = props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<MomSettings>(settingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={momChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="MOM"
              chartType={momChartType}
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
              <MomentumSeries klines={klines} settings={settings} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const momSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type MomentumSeriesProps = { klines: readonly Kline[]; settings: MomSettings };
function MomentumSeries(props: MomentumSeriesProps) {
  const { klines, settings } = props;
  const { source, period, color } = settings;

  const [momData, setMomData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    const sourceValue = klines.map(prop(source));
    void momentum(sourceValue, Number(period))
      .then((mom) =>
        mom.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((momData) => setMomData(o.some(momData)));
  }, [klines, source, period]);

  const seriesOptions = useMemo(() => ({ ...momSeriesOptions, color }), [color]);

  return o.isNone(momData) ? undefined : (
    <Chart.Series id={momChartType} type="Line" data={momData.value} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="MOM" color={seriesOptions.color}>
        <Chart.SeriesValue defaultValue={momData.value.at(-1)?.value} formatValue={to4Digits} />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<MomSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <SourceField control={control} />
        <PeriodField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="Momentum line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
