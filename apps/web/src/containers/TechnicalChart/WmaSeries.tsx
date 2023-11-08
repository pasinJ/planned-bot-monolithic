import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight, prop } from 'ramda';
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
import SeriesLegendWithMenus from './components/SeriesLegendWithMenus';
import SettingsModal from './components/SettingsModal';
import SourceField from './components/SourceField';
import { wma } from './indicators';
import { Source, dateToUtcTimestamp, formatValue, randomHexColor } from './utils';

export type WmaSeriesType = typeof wmaSeriesType;
const wmaSeriesType = 'wma';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
};

type WmaSettings = { name: string; source: Source; period: IntegerString; color: HexColor };
const defaultSettings: WmaSettings = {
  name: 'WMA',
  source: 'close',
  period: '9' as IntegerString,
  color: '#000000' as HexColor,
};
const defaultSettingsFormOptions: UseFormProps<WmaSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type WmaSeriesProps = {
  id: string;
  klines: readonly Kline[];
  handleRemoveSeries: (id: string) => void;
  maxDecimalDigits?: number;
};
export default function WmaSeries(props: WmaSeriesProps) {
  const { id, klines, maxDecimalDigits, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<WmaSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<WmaSettings>(formOptions);
  const settings = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color: settings.color }),
    [hidden, settings.color],
  );

  const wmaData = useWmaData(klines, settings);

  return o.isNone(wmaData) ? undefined : (
    <Chart.Series id={wmaSeriesType} type="Line" data={wmaData.value} options={seriesOptions}>
      <SeriesLegendWithMenus
        id={id}
        title={settings.name}
        color={seriesOptions.color}
        legend={
          <Chart.SeriesValue
            defaultValue={wmaData.value.at(-1)?.value}
            formatValue={formatValue(4, maxDecimalDigits)}
          />
        }
        hidden={hidden}
        handleToggleHidden={handleToggleHidden}
        handleSettingOpen={handleSettingOpen}
        handleRemoveSeries={handleRemoveSeries}
      >
        <SettingsModal
          open={settingOpen}
          onClose={handleClose}
          reset={reset}
          prevValue={settings}
          validSettings={trigger}
        >
          <SettingsForm control={control} />
        </SettingsModal>
      </SeriesLegendWithMenus>
    </Chart.Series>
  );
}

function useWmaData(klines: readonly Kline[], settings: WmaSettings) {
  const { source, period } = settings;

  const [wmaData, setWmaData] = useState<o.Option<LineData[]>>(o.none);

  useEffect(() => {
    const sourceValue = klines.map(prop(source)) as number[];
    void wma(sourceValue, Number(period))
      .then((wma) =>
        wma.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((wmaData) => setWmaData(o.some(wmaData)));
  }, [klines, source, period]);

  return wmaData;
}

function SettingsForm({ control }: { control: Control<WmaSettings> }) {
  return (
    <form className="flex flex-col space-y-2 py-6">
      <div className="flex flex-col space-y-2">
        <NameField control={control} />
        <SourceField control={control} />
        <PeriodField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField name="color" labelId="wma-color" label="WMA line color" control={control} />
      </div>
    </form>
  );
}
