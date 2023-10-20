import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { UseFormProps, useForm } from 'react-hook-form';

import { supertrend } from 'src/containers/TechnicalChart/indicators';
import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { DecimalString, HexColor, IntegerString } from '#shared/utils/string';

import ColorField from './components/ColorField';
import DecimalConfigField from './components/DecimalConfigField';
import IntegerConfigField from './components/IntegerConfigField';
import NameField from './components/NameField';
import { Series, SeriesObj } from './components/Series';
import SeriesLegendWithMenus from './components/SeriesLegendWithMenus';
import SettingsModal from './components/SettingsModal';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { dateToUtcTimestamp, formatLegend, randomHexColor } from './utils';

export type SupertrendSeriesType = 'supertrend';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = { lastValueVisible: false };

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
export const SupertrendSeries = forwardRef<o.Option<SeriesObj>, SupertrendSeriesProps>(
  function SupertrendSeries(props, ref) {
    const { id, klines, handleRemoveSeries } = props;

    const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
    const [hidden, handleToggleHidden] = useClickToggle(false);

    const formOptions = useMemo<UseFormProps<SupertrendSettings>>(
      () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
      [],
    );
    const { control, getValues, reset } = useForm<SupertrendSettings>(formOptions);
    const { name, factor, atrPeriod, color } = getValues();

    const seriesOptions = useMemo(
      () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color }),
      [hidden, color],
    );

    const _series = useSeriesObjRef(ref);
    const [supertrendData, setSupertrendData] = useState<o.Option<LineData[]>>(o.none);
    const transformedData = useMemo(
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
    const { legend, updateLegend, setLegend } = useSeriesLegend({
      data: o.isSome(supertrendData) ? supertrendData.value : null,
      seriesRef: _series,
    });

    useEffect(() => {
      void supertrend(klines, Number(factor), Number(atrPeriod))
        .then(({ supertrend }) => {
          return supertrend.map((value, index) => ({
            time: dateToUtcTimestamp(klines[index].openTimestamp),
            value: index === 0 ? NaN : value,
          }));
        })
        .then((supertrendData) => {
          setSupertrendData(o.some(supertrendData));
          return supertrendData;
        })
        .then((supertrendData) => setLegend(formatLegend(supertrendData.at(-1)?.value)));
    }, [klines, factor, atrPeriod, setLegend]);

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
                <DecimalConfigField id="factor" label="Factor" name="factor" control={control} />
                <IntegerConfigField id="atr-period" label="ATR period" name="atrPeriod" control={control} />
              </div>
              <Divider>Style</Divider>
              <div className="flex flex-col space-y-2 pt-2">
                <ColorField
                  name="color"
                  labelId="supertrend-color"
                  label="Supertrend line color"
                  control={control}
                />
              </div>
            </form>
          </SettingsModal>
        </SeriesLegendWithMenus>
      </Series>
    );
  },
);
