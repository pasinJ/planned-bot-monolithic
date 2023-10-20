import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { DeepPartial, LineData, LineStyle, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { UseFormProps, useForm } from 'react-hook-form';
import { psar } from 'src/containers/TechnicalChart/indicators';

import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { DecimalString, HexColor } from '#shared/utils/string';

import ColorField from './components/ColorField';
import DecimalConfigField from './components/DecimalConfigField';
import NameField from './components/NameField';
import SeriesLegendWithMenus from './components/SeriesLegendWithMenus';
import SettingsModal from './components/SettingsModal';
import { Series, SeriesObj } from './containers/Series';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { dateToUtcTimestamp, formatLegend, randomHexColor } from './utils';

export type PsarSeriesType = 'psar';

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

type PsarSeriesProps = { id: string; klines: readonly Kline[]; handleRemoveSeries: (id: string) => void };
export const PsarSeries = forwardRef<o.Option<SeriesObj>, PsarSeriesProps>(function PsarSeries(props, ref) {
  const { id, klines, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<PsarSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset } = useForm<PsarSettings>(formOptions);
  const { name, step, max, color } = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color }),
    [hidden, color],
  );

  const _series = useSeriesObjRef(ref);
  const [psarData, setPsarData] = useState<o.Option<LineData[]>>(o.none);
  const transformedData = useMemo(
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
  const { legend, updateLegend, setLegend } = useSeriesLegend({
    data: o.isSome(psarData) ? psarData.value : null,
    seriesRef: _series,
  });

  useEffect(() => {
    void psar(klines, Number(step), Number(max))
      .then((psar) =>
        psar.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((psarData) => {
        setPsarData(o.some(psarData));
        return psarData;
      })
      .then((psarData) => setLegend(formatLegend(psarData.at(-1)?.value)));
  }, [klines, step, max, setLegend]);

  return o.isNone(transformedData) ? (
    <div>Loading...</div>
  ) : (
    <Series
      ref={_series}
      type="Line"
      data={transformedData.value}
      options={seriesOptions}
      crosshairMoveCb={updateLegend}
    >
      <SeriesLegendWithMenus
        id={id}
        title={name}
        color={seriesOptions.color}
        legend={legend}
        hidden={hidden}
        handleToggleHidden={handleToggleHidden}
        handleSettingOpen={handleSettingOpen}
        handleRemoveSeries={handleRemoveSeries}
      >
        <SettingsModal open={settingOpen} onClose={handleClose} reset={reset} prevValue={getValues()}>
          <form className="flex flex-col space-y-2 py-6">
            <div className="flex flex-col space-y-2">
              <NameField control={control} />
              <DecimalConfigField id="step" label="Increment step" name="step" control={control} />
              <DecimalConfigField id="max" label="Max value" name="max" control={control} />
            </div>
            <Divider>Style</Divider>
            <div className="flex flex-col space-y-2 pt-2">
              <ColorField name="color" labelId="psar-color" label="PSAR line color" control={control} />
            </div>
          </form>
        </SettingsModal>
      </SeriesLegendWithMenus>
    </Series>
  );
});
