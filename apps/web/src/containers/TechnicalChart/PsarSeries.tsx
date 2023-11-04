import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { DeepPartial, LineData, LineStyle, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import { useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import DecimalFieldRf from '#components/DecimalFieldRf';
import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { DecimalString, HexColor } from '#shared/utils/string';

import Chart from '../Chart';
import ColorField from './components/ColorField';
import NameField from './components/NameField';
import SeriesLegendWithMenus from './components/SeriesLegendWithMenus';
import SettingsModal from './components/SettingsModal';
import { psar } from './indicators';
import { dateToUtcTimestamp, formatValue, randomHexColor } from './utils';

export type PsarSeriesType = typeof psarSeriesType;
const psarSeriesType = 'psar';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lineStyle: LineStyle.Dotted,
  lastValueVisible: false,
  priceLineVisible: false,
};

type PsarSettings = { name: string; step: DecimalString; max: DecimalString; color: HexColor };
const defaultSettings: PsarSettings = {
  name: 'PSAR',
  step: '0.02' as DecimalString,
  max: '0.2' as DecimalString,
  color: '#000000' as HexColor,
};
const defaultSettingsFormOptions: UseFormProps<PsarSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type PsarSeriesProps = {
  id: string;
  klines: readonly Kline[];
  handleRemoveSeries: (id: string) => void;
  maxDecimalDigits?: number;
};
export default function PsarSeries(props: PsarSeriesProps) {
  const { id, klines, maxDecimalDigits, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<PsarSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<PsarSettings>(formOptions);
  const settings = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color: settings.color }),
    [hidden, settings.color],
  );

  const psarData = usePsarData(klines, settings);

  return o.isNone(psarData) ? undefined : (
    <Chart.Series id={psarSeriesType} type="Line" data={psarData.value} options={seriesOptions}>
      <SeriesLegendWithMenus
        id={id}
        title={settings.name}
        color={seriesOptions.color}
        legend={
          <Chart.SeriesValue
            defaultValue={psarData.value.at(-1)?.value}
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

function usePsarData(klines: readonly Kline[], settings: PsarSettings) {
  const { step, max } = settings;

  const [psarData, setPsarData] = useState<o.Option<LineData[]>>(o.none);

  useEffect(() => {
    void psar(klines, Number(step), Number(max))
      .then((psar) =>
        psar.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((psarData) => setPsarData(o.some(psarData)));
  }, [klines, step, max]);

  const styledData = useMemo(
    () =>
      pipe(
        psarData,
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
    [psarData, klines],
  );

  return styledData;
}

function SettingsForm({ control }: { control: Control<PsarSettings> }) {
  return (
    <form className="flex flex-col space-y-2 py-6">
      <div className="flex flex-col space-y-2">
        <NameField control={control} />
        <DecimalFieldRf
          controllerProps={{
            control,
            name: 'step',
            rules: { required: `Increment step is required` },
          }}
          fieldProps={{ id: 'step', label: 'Increment step', required: true }}
        />
        <DecimalFieldRf
          controllerProps={{
            control,
            name: 'max',
            rules: { required: `Max value is required` },
          }}
          fieldProps={{ id: 'max', label: 'Max value', required: true }}
        />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField name="color" labelId="psar-color" label="PSAR line color" control={control} />
      </div>
    </form>
  );
}
