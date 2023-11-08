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
import { vwma } from './indicators';
import { Source, dateToUtcTimestamp, formatValue, randomHexColor } from './utils';

export type VwmaSeriesType = typeof vwmaSeriesType;
const vwmaSeriesType = 'vwma';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
};

type VwmaSettings = { name: string; source: Source; period: IntegerString; color: HexColor };
const defaultSettings: VwmaSettings = {
  name: 'VWMA',
  source: 'close',
  period: '20' as IntegerString,
  color: '#000000' as HexColor,
};
const defaultSettingsFormOptions: UseFormProps<VwmaSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type VwmaSeriesProps = {
  id: string;
  klines: readonly Kline[];
  handleRemoveSeries: (id: string) => void;
  maxDecimalDigits?: number;
};
export default function VwmaSeries(props: VwmaSeriesProps) {
  const { id, klines, maxDecimalDigits, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<VwmaSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<VwmaSettings>(formOptions);
  const settings = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color: settings.color }),
    [hidden, settings.color],
  );

  const vwmaData = useVwmaData(klines, settings);

  return o.isNone(vwmaData) ? undefined : (
    <Chart.Series id={vwmaSeriesType} type="Line" data={vwmaData.value} options={seriesOptions}>
      <SeriesLegendWithMenus
        id={id}
        title={settings.name}
        color={seriesOptions.color}
        legend={
          <Chart.SeriesValue
            defaultValue={vwmaData.value.at(-1)?.value}
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

function useVwmaData(klines: readonly Kline[], settings: VwmaSettings) {
  const { source, period } = settings;

  const [vwmaData, setVwmaData] = useState<o.Option<LineData[]>>(o.none);

  useEffect(() => {
    const sourceValue = klines.map(prop(source)) as number[];
    void vwma(klines, sourceValue, Number(period))
      .then((vwma) =>
        vwma.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((data) => setVwmaData(o.some(data)));
  }, [klines, source, period]);

  return vwmaData;
}

function SettingsForm({ control }: { control: Control<VwmaSettings> }) {
  return (
    <form className="flex flex-col space-y-2 py-6">
      <div className="flex flex-col space-y-2">
        <NameField control={control} />
        <SourceField control={control} />
        <PeriodField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField name="color" labelId="vwma-color" label="VWMA line color" control={control} />
      </div>
    </form>
  );
}
