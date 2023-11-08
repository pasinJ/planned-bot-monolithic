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
import { emv } from './indicators';
import { dateToUtcTimestamp, formatValue } from './utils';

export type EmvChartType = typeof emvChartType;
const emvChartType = 'emv';

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
  maxDecimalDigits?: number;
};
export default function EmvChart(props: EmvChartProps) {
  const { klines, options, maxDecimalDigits, crosshairMoveCb, logicalRangeChangeCb, handleRemoveChart } =
    props;

  const { container, handleContainerRef } = useChartContainer();
  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

  const [settingOpen, handleOpenSettings, handleCloseSettings] = useOpenModal(false);
  const { control, getValues, reset, trigger } = useForm<EmvSettings>(defaultSettingFormOptions);
  const settings = getValues();

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container
          id={emvChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
            <ChartTitleWithMenus
              title="EMV"
              chartType={emvChartType}
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
              <EmvSeries klines={klines} color={settings.color} maxDecimalDigits={maxDecimalDigits} />
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const emvSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineWidth: 2,
  color: defaultSettings.color,
  lastValueVisible: false,
  priceLineVisible: false,
};
type EmvSeriesProps = { klines: readonly Kline[]; color: HexColor; maxDecimalDigits?: number };
function EmvSeries(props: EmvSeriesProps) {
  const { klines, color, maxDecimalDigits } = props;

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
  const seriesOptions = useMemo(() => ({ ...emvSeriesOptions, color }), [color]);

  return o.isNone(emvData) ? undefined : (
    <Chart.Series id={emvChartType} type="Line" data={emvData.value} options={seriesOptions}>
      <SeriesLegendWithoutMenus name="EMV" color={seriesOptions.color}>
        <Chart.SeriesValue
          defaultValue={emvData.value.at(-1)?.value}
          formatValue={formatValue(4, maxDecimalDigits)}
        />
      </SeriesLegendWithoutMenus>
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<EmvSettings> }) {
  return (
    <form className="flex flex-col py-6">
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField label="EMV line color" labelId="line-color" name="color" control={control} />
      </div>
    </form>
  );
}
