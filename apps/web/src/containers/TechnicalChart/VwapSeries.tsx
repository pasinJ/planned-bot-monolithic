import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import { useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { to4Digits } from '#shared/utils/number';
import { HexColor, IntegerString } from '#shared/utils/string';

import Chart from '../Chart';
import ColorField from './components/ColorField';
import NameField from './components/NameField';
import PeriodField from './components/PeriodField';
import SeriesLegendWithMenus from './components/SeriesLegendWithMenus';
import SettingsModal from './components/SettingsModal';
import { vwap } from './indicators';
import { dateToUtcTimestamp, randomHexColor } from './utils';

export type VwapSeriesType = typeof vwapSeriesType;
const vwapSeriesType = 'vwap';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
};

type VwapSettings = { name: string; period: IntegerString; color: HexColor };
const defaultSettings: VwapSettings = {
  name: 'VWAP',
  period: '9' as IntegerString,
  color: '#000000' as HexColor,
};
const defaultSettingsFormOptions: UseFormProps<VwapSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type VwapSeriesProps = { id: string; klines: readonly Kline[]; handleRemoveSeries: (id: string) => void };
export default function VwapSeries(props: VwapSeriesProps) {
  const { id, klines, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<VwapSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<VwapSettings>(formOptions);
  const settings = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color: settings.color }),
    [hidden, settings.color],
  );

  const vwapData = useVwapData(klines, settings);

  return o.isNone(vwapData) ? undefined : (
    <Chart.Series id={vwapSeriesType} type="Line" data={vwapData.value} options={seriesOptions}>
      <SeriesLegendWithMenus
        id={id}
        title={settings.name}
        color={seriesOptions.color}
        legend={<Chart.SeriesValue defaultValue={vwapData.value.at(-1)?.value} formatValue={to4Digits} />}
        hidden={hidden}
        handleToggleHidden={handleToggleHidden}
        handleSettingOpen={handleSettingOpen}
        handleRemoveSeries={handleRemoveSeries}
      >
        <SettingsModal
          open={settingOpen}
          onClose={handleClose}
          reset={reset}
          prevValue={getValues()}
          validSettings={trigger}
        >
          <SettingsForm control={control} />
        </SettingsModal>
      </SeriesLegendWithMenus>
    </Chart.Series>
  );
}

function useVwapData(klines: readonly Kline[], settings: VwapSettings) {
  const { period } = settings;

  const [vwapData, setVwapData] = useState<o.Option<LineData[]>>(o.none);

  useEffect(() => {
    void vwap(klines, Number(period))
      .then((vwap) =>
        vwap.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((vwapData) => setVwapData(o.some(vwapData)));
  }, [klines, period]);

  return vwapData;
}

function SettingsForm({ control }: { control: Control<VwapSettings> }) {
  return (
    <form className="flex flex-col space-y-2 py-6">
      <div className="flex flex-col space-y-2">
        <NameField control={control} />
        <PeriodField control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField name="color" labelId="vwap-color" label="VWAP line color" control={control} />
      </div>
    </form>
  );
}
