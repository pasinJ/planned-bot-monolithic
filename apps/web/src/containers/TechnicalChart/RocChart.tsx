import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import {
  CreatePriceLineOptions,
  DeepPartial,
  LineData,
  LineStyle,
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
import { HexColor, IntegerString } from '#shared/utils/string';

import Chart, { useChartContainer } from '../Chart';
import ChartTitleWithMenus from './components/ChartTitleWithMenus';
import ColorField from './components/ColorField';
import PeriodField from './components/PeriodField';
import SeriesLegendWithoutMenus from './components/SeriesLegendWithoutMenus';
import SettingsModal from './components/SettingsModal';
import SourceField from './components/SourceField';
import { roc } from './indicators';
import { Source, dateToUtcTimestamp, formatValue } from './utils';

export type RocChartType = typeof rocChartType;
const rocChartType = 'roc';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 300 };

type RocSettings = { source: Source; period: IntegerString; color: HexColor; zeroLineColor: HexColor };
const defaultSettings: RocSettings = {
  source: 'close',
  period: '9' as IntegerString,
  color: '#2962FF' as HexColor,
  zeroLineColor: '#787B86' as HexColor,
};
const settingFormOptions: UseFormProps<RocSettings> = { defaultValues: defaultSettings, mode: 'onBlur' };

type RocChartProps = {
  klines: readonly Kline[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  handleRemoveChart: (chartType: RocChartType) => void;
  maxDecimalDigits?: number;
};
export default function RocChart(props: RocChartProps) {
  const { klines, options, maxDecimalDigits, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } =
    props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<RocSettings>(settingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={rocChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="ROC"
              chartType={rocChartType}
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
              <RocSeries klines={klines} settings={settings} maxDecimalDigits={maxDecimalDigits} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const rocSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
const zeroLineOptions: CreatePriceLineOptions & { id: string } = {
  id: 'zero-line',
  price: 0,
  color: defaultSettings.zeroLineColor,
  lineWidth: 2,
  lineStyle: LineStyle.Dashed,
};
type RocSeriesProps = { klines: readonly Kline[]; settings: RocSettings; maxDecimalDigits?: number };
function RocSeries(props: RocSeriesProps) {
  const { klines, settings, maxDecimalDigits } = props;
  const { source, period, color } = settings;

  const [rocData, setRocData] = useState<o.Option<LineData[]>>(o.none);
  useEffect(() => {
    const sourceValue = klines.map(prop(source));
    void roc(sourceValue, Number(period))
      .then((roc) =>
        roc.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((rocData) => setRocData(o.some(rocData)));
  }, [klines, source, period]);

  const seriesOptions = useMemo(() => ({ ...rocSeriesOptions, color }), [color]);

  return o.isNone(rocData) ? undefined : (
    <Chart.Series
      id={rocChartType}
      type="Line"
      data={rocData.value}
      options={seriesOptions}
      priceLinesOptions={[zeroLineOptions]}
    >
      <SeriesLegendWithoutMenus name="ROC" color={seriesOptions.color}>
        <Chart.SeriesValue
          defaultValue={rocData.value.at(-1)?.value}
          formatValue={formatValue(4, maxDecimalDigits)}
        />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<RocSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <div className="flex flex-col space-y-2">
        <SourceField control={control} />
        <PeriodField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="Roc line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
