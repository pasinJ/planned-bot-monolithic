import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import { useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import DecimalFieldRf from '#components/DecimalFieldRf';
import IntegerFieldRf from '#components/IntegerFieldRf';
import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { to4Digits } from '#shared/utils/number';
import { DecimalString, HexColor, IntegerString } from '#shared/utils/string';

import Chart from '../Chart';
import ColorField from './components/ColorField';
import NameField from './components/NameField';
import SeriesLegendWithMenus from './components/SeriesLegendWithMenus';
import SettingsModal from './components/SettingsModal';
import { supertrend } from './indicators';
import { dateToUtcTimestamp, randomHexColor } from './utils';

export type SupertrendSeriesType = typeof supertrendSeriesType;
const supertrendSeriesType = 'supertrend';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
};

type SupertrendSettings = { name: string; factor: DecimalString; atrPeriod: IntegerString; color: HexColor };
const defaultSettings: SupertrendSettings = {
  name: 'Supertrend',
  factor: '3' as DecimalString,
  atrPeriod: '10' as IntegerString,
  color: '#000000' as HexColor,
};
const defaultSettingsFormOptions: UseFormProps<SupertrendSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type SupertrendSeriesProps = {
  id: string;
  klines: readonly Kline[];
  handleRemoveSeries: (id: string) => void;
};
export default function SupertrendSeries(props: SupertrendSeriesProps) {
  const { id, klines, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<SupertrendSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<SupertrendSettings>(formOptions);
  const settings = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color: settings.color }),
    [hidden, settings.color],
  );

  const supertrendData = useSupertrendData(klines, settings);

  return o.isNone(supertrendData) ? undefined : (
    <Chart.Series id={supertrendSeriesType} type="Line" data={supertrendData.value} options={seriesOptions}>
      <SeriesLegendWithMenus
        id={id}
        title={settings.name}
        color={seriesOptions.color}
        legend={
          <Chart.SeriesValue defaultValue={supertrendData.value.at(-1)?.value} formatValue={to4Digits} />
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

function useSupertrendData(klines: readonly Kline[], settings: SupertrendSettings) {
  const { factor, atrPeriod } = settings;

  const [supertrendData, setSupertrendData] = useState<o.Option<LineData[]>>(o.none);

  useEffect(() => {
    void supertrend(klines, Number(factor), Number(atrPeriod))
      .then(({ supertrend }) => {
        return supertrend.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value: index === 0 ? NaN : value,
        }));
      })
      .then((supertrendData) => setSupertrendData(o.some(supertrendData)));
  }, [klines, factor, atrPeriod]);

  const styledData = useMemo(
    () =>
      pipe(
        supertrendData,
        o.map((data) =>
          data.map((bar, index) => ({
            ...bar,
            color:
              index !== data.length - 1 &&
              ((bar.value > klines[index].open && data[index + 1].value < klines[index + 1].open) ||
                (bar.value < klines[index].open && data[index + 1].value > klines[index + 1].open))
                ? 'transparent'
                : undefined,
          })),
        ),
      ),
    [supertrendData, klines],
  );

  return styledData;
}

function SettingsForm({ control }: { control: Control<SupertrendSettings> }) {
  return (
    <form className="flex flex-col space-y-2 py-6">
      <div className="flex flex-col space-y-2">
        <NameField control={control} />
        <DecimalFieldRf
          controllerProps={{
            control,
            name: 'factor',
            rules: { required: `Factor is required` },
          }}
          fieldProps={{ id: 'factor', label: 'Factor', required: true }}
        />
        <IntegerFieldRf
          controllerProps={{
            control,
            name: 'atrPeriod',
            rules: { required: `ATR period is required` },
          }}
          fieldProps={{ id: 'atr-period', label: 'ATR period', required: true }}
        />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField name="color" labelId="supertrend-color" label="Supertrend line color" control={control} />
      </div>
    </form>
  );
}
