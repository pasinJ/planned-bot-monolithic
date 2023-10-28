import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight, prop } from 'ramda';
import { useEffect, useMemo, useState } from 'react';
import { UseFormProps, useForm } from 'react-hook-form';

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
import SourceField from './components/SourceField';
import { ema } from './indicators';
import { Source, dateToUtcTimestamp, randomHexColor } from './utils';

export type EmaSeriesType = typeof emaSeriesType;
const emaSeriesType = 'ema';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
};

type EmaSettings = { name: string; source: Source; period: IntegerString; color: HexColor };
const defaultSettings: EmaSettings = {
  name: 'EMA',
  source: 'close',
  period: '9' as IntegerString,
  color: '#000000' as HexColor,
};
const defaultSettingsFormOptions: UseFormProps<EmaSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type EmaSeriesProps = { id: string; klines: readonly Kline[]; handleRemoveSeries: (id: string) => void };
export default function EmaSeries(props: EmaSeriesProps) {
  const { id, klines, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<EmaSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<EmaSettings>(formOptions);
  const settings = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color: settings.color }),
    [hidden, settings.color],
  );

  const emaData = useEmaData(klines, settings);

  return o.isNone(emaData) ? undefined : (
    <Chart.Series id={emaSeriesType} type="Line" data={emaData.value} options={seriesOptions}>
      <SeriesLegendWithMenus
        id={id}
        title={settings.name}
        color={seriesOptions.color}
        hidden={hidden}
        handleToggleHidden={handleToggleHidden}
        handleSettingOpen={handleSettingOpen}
        handleRemoveSeries={handleRemoveSeries}
        legend={<Chart.SeriesValue defaultValue={emaData.value.at(-1)?.value} formatValue={to4Digits} />}
      >
        <SettingsModal
          open={settingOpen}
          onClose={handleClose}
          reset={reset}
          prevValue={settings}
          validSettings={trigger}
        >
          <form className="flex flex-col space-y-2 py-6">
            <div className="flex flex-col space-y-2">
              <NameField control={control} />
              <SourceField control={control} />
              <PeriodField control={control} />
            </div>
            <Divider>Style</Divider>
            <div className="flex flex-col space-y-2 pt-2">
              <ColorField name="color" labelId="ema-color" label="EMA line color" control={control} />
            </div>
          </form>
        </SettingsModal>
      </SeriesLegendWithMenus>
    </Chart.Series>
  );
}

function useEmaData(klines: readonly Kline[], settings: EmaSettings) {
  const { source, period } = settings;

  const [emaData, setEmaData] = useState<o.Option<LineData[]>>(o.none);

  useEffect(() => {
    const sourceValue = klines.map(prop(source)) as number[];
    void ema(sourceValue, Number(period))
      .then((ema) =>
        ema.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((emaData) => setEmaData(o.some(emaData)));
  }, [klines, source, period]);

  return emaData;
}
