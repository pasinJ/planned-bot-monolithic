import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as o from 'fp-ts/lib/Option';
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor, IntegerString } from '#shared/utils/string';

import Chart from '../Chart';
import ColorField from './components/ColorField';
import NameField from './components/NameField';
import PeriodField from './components/PeriodField';
import RemoveButton from './components/RemoveButton';
import SettingsButton from './components/SettingButton';
import SettingsModal from './components/SettingsModal';
import StdDevField from './components/StdDevField';
import VisibilityButton from './components/VisibilityButton';
import { kc } from './indicators';
import { dateToUtcTimestamp, formatValue } from './utils';

export type KcSeriesType = typeof kcSeriesType;
const kcSeriesType = 'kc';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
  lineWidth: 2,
};
const defaultMiddleSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  ...defaultSeriesOptions,
  lineWidth: 1,
};

type KcSettings = {
  name: string;
  period: IntegerString;
  stddev: IntegerString;
  upperLineColor: HexColor;
  middleLineColor: HexColor;
  lowerLineColor: HexColor;
};
const defaultSettings: KcSettings = {
  name: 'KC',
  period: '20' as IntegerString,
  stddev: '2' as IntegerString,
  upperLineColor: '#2962FF' as HexColor,
  middleLineColor: '#2962FF' as HexColor,
  lowerLineColor: '#2962FF' as HexColor,
};
const defaultSettingsFormOptions: UseFormProps<KcSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type KcSeriesProps = {
  id: string;
  klines: readonly Kline[];
  handleRemoveSeries: (id: string) => void;
  maxDecimalDigits?: number;
};
export default function KcSeries(props: KcSeriesProps) {
  const { id, klines, maxDecimalDigits, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const { control, getValues, reset, trigger } = useForm<KcSettings>(defaultSettingsFormOptions);
  const settings = getValues();

  const kcData = useKcData(klines, settings);

  return o.isNone(kcData) ? undefined : (
    <>
      <div className="group flex items-center space-x-1.5">
        <Typography className="font-medium" color={settings.middleLineColor}>
          {settings.name}
        </Typography>
        <div className="flex gap-x-1 group-hover:hidden">
          <BandSeries
            id="upper"
            data={kcData.value.upper}
            hidden={hidden}
            color={settings.upperLineColor}
            maxDecimalDigits={maxDecimalDigits}
          />
          <BandSeries
            id="middle"
            data={kcData.value.middle}
            hidden={hidden}
            color={settings.middleLineColor}
            maxDecimalDigits={maxDecimalDigits}
          />
          <BandSeries
            id="lower"
            data={kcData.value.lower}
            hidden={hidden}
            color={settings.lowerLineColor}
            maxDecimalDigits={maxDecimalDigits}
          />
        </div>
        <div>
          <VisibilityButton hidden={hidden} toggleHidden={handleToggleHidden} />
          <SettingsButton openSettings={handleSettingOpen} />
          <RemoveButton objKey={id} remove={handleRemoveSeries} />
        </div>
      </div>
      <SettingsModal
        open={settingOpen}
        onClose={handleClose}
        reset={reset}
        prevValue={settings}
        validSettings={trigger}
      >
        <SettingsForm control={control} />
      </SettingsModal>
    </>
  );
}

function useKcData(klines: readonly Kline[], settings: KcSettings) {
  const { period, stddev } = settings;

  type KcData = { upper: LineData[]; middle: LineData[]; lower: LineData[] };
  const [kcData, setKcData] = useState<o.Option<KcData>>(o.none);

  useEffect(() => {
    void kc(klines, Number(period), Number(stddev))
      .then(({ upper, middle, lower }) => ({
        upper: upper.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
        middle: middle.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
        lower: lower.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      }))
      .then((data) => setKcData(o.some(data)));
  }, [klines, period, stddev]);

  return kcData;
}

type BandSeriesProps = {
  id: string;
  data: LineData[];
  hidden: boolean;
  color: HexColor;
  maxDecimalDigits?: number;
};
function BandSeries(props: BandSeriesProps) {
  const { id, data, hidden, color, maxDecimalDigits } = props;

  const seriesOptions = useMemo(
    () => ({
      ...(id === 'middle' ? defaultMiddleSeriesOptions : defaultSeriesOptions),
      lineVisible: !hidden,
      color,
    }),
    [id, hidden, color],
  );

  return (
    <Chart.Series id={id} type="Line" data={data} options={seriesOptions}>
      <Chart.SeriesValue defaultValue={data.at(-1)?.value} formatValue={formatValue(4, maxDecimalDigits)} />
    </Chart.Series>
  );
}

function SettingsForm({ control }: { control: Control<KcSettings> }) {
  return (
    <form className="flex flex-col space-y-2 py-6">
      <div className="flex flex-col space-y-2">
        <NameField control={control} />
        <PeriodField control={control} />
        <StdDevField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField name="upperLineColor" labelId="upper-color" label="Upper line color" control={control} />
        <ColorField
          name="middleLineColor"
          labelId="middle-color"
          label="Middle line color"
          control={control}
        />
        <ColorField name="lowerLineColor" labelId="lower-color" label="Lower line color" control={control} />
      </div>
    </form>
  );
}
