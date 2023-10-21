import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight, prop } from 'ramda';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { UseFormProps, useForm } from 'react-hook-form';
import { vwma } from 'src/containers/TechnicalChart/indicators';

import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor, IntegerString } from '#shared/utils/string';

import ColorField from './components/ColorField';
import IntegerConfigField from './components/IntegerConfigField';
import NameField from './components/NameField';
import SeriesLegendWithMenus from './components/SeriesLegendWithMenus';
import SettingsModal from './components/SettingsModal';
import SourceField from './components/SourceField';
import { Series, SeriesObj } from './containers/Series';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { Source, dateToUtcTimestamp, formatLegend, randomHexColor } from './utils';

export type VwmaSeriesType = 'vwma';

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

type VwmaSeriesProps = { id: string; klines: readonly Kline[]; handleRemoveSeries: (id: string) => void };
export const VwmaSeries = forwardRef<o.Option<SeriesObj>, VwmaSeriesProps>(function VwmaSeries(props, ref) {
  const { id, klines, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<VwmaSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset } = useForm<VwmaSettings>(formOptions);
  const { name, source, period, color } = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color }),
    [hidden, color],
  );

  const _series = useSeriesObjRef(ref);
  const [vwmaData, setVwmaData] = useState<o.Option<LineData[]>>(o.none);
  const { legend, updateLegend, setLegend } = useSeriesLegend({
    data: o.isSome(vwmaData) ? vwmaData.value : null,
    seriesRef: _series,
  });

  useEffect(() => {
    const sourceValue = klines.map(prop(source)) as number[];
    void vwma(klines, sourceValue, Number(period))
      .then((vwma) =>
        vwma.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((vwmaData) => {
        setVwmaData(o.some(vwmaData));
        return vwmaData;
      })
      .then((vwmaData) => setLegend(formatLegend(vwmaData.at(-1)?.value)));
  }, [klines, source, period, setLegend]);

  return o.isNone(vwmaData) ? (
    <div>Loading...</div>
  ) : (
    <Series
      ref={_series}
      type="Line"
      data={vwmaData.value}
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
              <SourceField control={control} />
              <IntegerConfigField id="period" label="Period" name="period" control={control} />
            </div>
            <Divider>Style</Divider>
            <div className="flex flex-col space-y-2 pt-2">
              <ColorField name="color" labelId="vwma-color" label="VWMA line color" control={control} />
            </div>
          </form>
        </SettingsModal>
      </SeriesLegendWithMenus>
    </Series>
  );
});
