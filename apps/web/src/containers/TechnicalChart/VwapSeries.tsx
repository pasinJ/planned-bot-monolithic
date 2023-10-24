import Divider from '@mui/material/Divider';
import * as o from 'fp-ts/lib/Option';
import { DeepPartial, LineData, LineStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor, IntegerString } from '#shared/utils/string';

import ColorField from './components/ColorField';
import IntegerConfigField from './components/IntegerConfigField';
import NameField from './components/NameField';
import SeriesLegendWithMenus from './components/SeriesLegendWithMenus';
import SettingsModal from './components/SettingsModal';
import { Series, SeriesObj } from './containers/Series';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { vwap } from './indicators';
import { dateToUtcTimestamp, formatLegend, randomHexColor } from './utils';

export type VwapSeriesType = 'vwap';

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
export const VwapSeries = forwardRef<o.Option<SeriesObj>, VwapSeriesProps>(function VwapSeries(props, ref) {
  const { id, klines, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const formOptions = useMemo<UseFormProps<VwapSettings>>(
    () => mergeDeepRight(defaultSettingsFormOptions, { defaultValues: { color: randomHexColor() } }),
    [],
  );
  const { control, getValues, reset, trigger } = useForm<VwapSettings>(formOptions);
  const { name, period, color } = getValues();

  const seriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color }),
    [hidden, color],
  );

  const _series = useSeriesObjRef(ref);
  const [vwapData, setVwapData] = useState<o.Option<LineData[]>>(o.none);
  const { legend, updateLegend, setLegend } = useSeriesLegend({
    data: o.isSome(vwapData) ? vwapData.value : null,
    seriesRef: _series,
  });

  useEffect(() => {
    void vwap(klines, Number(period))
      .then((vwap) =>
        vwap.map((value, index) => ({ time: dateToUtcTimestamp(klines[index].openTimestamp), value })),
      )
      .then((vwapData) => {
        setVwapData(o.some(vwapData));
        return vwapData;
      })
      .then((vwapData) => setLegend(formatLegend(vwapData.at(-1)?.value)));
  }, [klines, period, setLegend]);

  return o.isNone(vwapData) ? (
    <div>Loading...</div>
  ) : (
    <Series
      ref={_series}
      type="Line"
      data={vwapData.value}
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
        <SettingsModal
          open={settingOpen}
          onClose={handleClose}
          reset={reset}
          prevValue={getValues()}
          validSettings={trigger}
        >
          <form className="flex flex-col space-y-2 py-6">
            <div className="flex flex-col space-y-2">
              <NameField control={control} />
              <IntegerConfigField id="period" label="Period" name="period" control={control} />
            </div>
            <Divider>Style</Divider>
            <div className="flex flex-col space-y-2 pt-2">
              <ColorField name="color" labelId="vwap-color" label="VWAP line color" control={control} />
            </div>
          </form>
        </SettingsModal>
      </SeriesLegendWithMenus>
    </Series>
  );
});
