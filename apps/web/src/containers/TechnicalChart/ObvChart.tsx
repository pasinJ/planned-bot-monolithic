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
import { obv } from './indicators';
import { dateToUtcTimestamp, formatValue, randomHexColor } from './utils';

export type ObvChartType = typeof obvChartType;
const obvChartType = 'obv';

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
  maxDecimalDigits?: number;
};
export default function ObvChart(props: ObvChartProps) {
  const { klines, options, maxDecimalDigits, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } =
    props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const settingFormOptions = useMemo(
    () => mergeDeepRight(defaultSettingFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<ObvSettings>(settingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={obvChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="OBV"
              chartType={obvChartType}
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
              <ObvSeries klines={klines} color={settings.color} maxDecimalDigits={maxDecimalDigits} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const obvSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type ObvSeriesProps = { klines: readonly Kline[]; color: HexColor; maxDecimalDigits?: number };
function ObvSeries(props: ObvSeriesProps) {
  const { klines, maxDecimalDigits, color } = props;

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

  const seriesOptions = useMemo(() => ({ ...obvSeriesOptions, color }), [color]);

  return o.isNone(obvData) ? undefined : (
    <Chart.Series id={obvChartType} type="Line" data={obvData.value} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="OBV" color={seriesOptions.color}>
        <Chart.SeriesValue
          defaultValue={obvData.value.at(-1)?.value}
          formatValue={formatValue(4, maxDecimalDigits)}
        />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<ObvSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="OBV line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
