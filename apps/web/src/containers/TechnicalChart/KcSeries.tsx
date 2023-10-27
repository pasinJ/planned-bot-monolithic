import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import * as e from 'fp-ts/lib/Either';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import {
  DeepPartial,
  LineData,
  LineStyleOptions,
  MouseEventHandler as MouseEventHandlerChart,
  SeriesOptionsCommon,
  Time,
} from 'lightweight-charts';
import { MouseEventHandler, forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Control, UseFormProps, useForm } from 'react-hook-form';

import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import useOpenModal from '#hooks/useOpenModal';
import { HexColor, IntegerString } from '#shared/utils/string';

import ColorField from './components/ColorField';
import IntegerConfigField from './components/IntegerConfigField';
import NameField from './components/NameField';
import RemoveButton from './components/RemoveButton';
import SettingsButton from './components/SettingButton';
import SettingsModal from './components/SettingsModal';
import VisibilityButton from './components/VisibilityButton';
import { Series, SeriesObj } from './containers/Series';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import { kc } from './indicators';
import { dateToUtcTimestamp, formatLegend, isMouseInDataRange, isMouseOffChart } from './utils';

export type KcSeriesType = 'kc';

const defaultSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  lastValueVisible: false,
  priceLineVisible: false,
  lineWidth: 2,
};
const defaultMiddleSeriesOptions: DeepPartial<LineStyleOptions & SeriesOptionsCommon> = {
  ...defaultSeriesOptions,
  lineWidth: 1,
};

type KcSettings = {
  name: string;
  period: IntegerString;
  stddev: IntegerString;
  upperLineColor: HexColor;
  middleLineColor: HexColor;
  lowerLineColor: HexColor;
};
const defaultSettings: KcSettings = {
  name: 'KC',
  period: '20' as IntegerString,
  stddev: '2' as IntegerString,
  upperLineColor: '#2962FF' as HexColor,
  middleLineColor: '#2962FF' as HexColor,
  lowerLineColor: '#2962FF' as HexColor,
};
const defaultSettingsFormOptions: UseFormProps<KcSettings> = {
  defaultValues: defaultSettings,
  mode: 'onBlur',
};

type KcSeriesProps = { id: string; klines: readonly Kline[]; handleRemoveSeries: (id: string) => void };
export const KcSeries = forwardRef<o.Option<SeriesObj>, KcSeriesProps>(function KcSeries(props, ref) {
  const { id, klines, handleRemoveSeries } = props;

  const [settingOpen, handleSettingOpen, handleClose] = useOpenModal(false);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const { control, getValues, reset, trigger } = useForm<KcSettings>(defaultSettingsFormOptions);
  const { name, period, stddev, upperLineColor, middleLineColor, lowerLineColor } = getValues();

  const upperSeriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color: upperLineColor }),
    [hidden, upperLineColor],
  );
  const middleSeriesOptions = useMemo(
    () => ({ ...defaultMiddleSeriesOptions, lineVisible: !hidden, color: middleLineColor }),
    [hidden, middleLineColor],
  );
  const lowerSeriesOptions = useMemo(
    () => ({ ...defaultSeriesOptions, lineVisible: !hidden, color: lowerLineColor }),
    [hidden, lowerLineColor],
  );

  type KcData = { upper: LineData[]; middle: LineData[]; lower: LineData[] };
  const [kcData, setKcData] = useState<o.Option<KcData>>(o.none);

  const _upperSeries = useSeriesObjRef(ref);
  const _middleSeries = useSeriesObjRef(ref);
  const _lowerSeries = useSeriesObjRef(ref);
  useEffect(() => {
    void kc(klines, Number(period), Number(stddev))
      .then(({ upper, middle, lower }) => ({
        upper: upper.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
        middle: middle.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
        lower: lower.map((value, index) => ({
          time: dateToUtcTimestamp(klines[index].openTimestamp),
          value,
        })),
      }))
      .then((kcData) => {
        setKcData(o.some(kcData));
        return kcData;
      })
      .then((kcData) =>
        setLegend({
          upper: formatLegend(kcData.upper.at(-1)?.value),
          middle: formatLegend(kcData.middle.at(-1)?.value),
          lower: formatLegend(kcData.lower.at(-1)?.value),
        }),
      );
  }, [klines, period, stddev]);

  type KcLegend = { upper: string; middle: string; lower: string };
  const [legend, setLegend] = useState<KcLegend>(() =>
    pipe(
      kcData,
      o.match(
        () => ({ upper: 'n/a', middle: 'n/a', lower: 'n/a' }),
        (kcData): KcLegend => ({
          upper: formatLegend(kcData.upper.at(-1)?.value),
          middle: formatLegend(kcData.middle.at(-1)?.value),
          lower: formatLegend(kcData.lower.at(-1)?.value),
        }),
      ),
    ),
  );
  const updateLegend: MouseEventHandlerChart<Time> = useCallback(
    (param) => {
      if (
        o.isNone(_upperSeries.current) ||
        o.isNone(_middleSeries.current) ||
        o.isNone(_lowerSeries.current)
      ) {
        return;
      }

      const upperSeries = _upperSeries.current.value.getSeries();
      const middleSeries = _middleSeries.current.value.getSeries();
      const lowerSeries = _lowerSeries.current.value.getSeries();
      if (e.isLeft(upperSeries) || e.isLeft(middleSeries) || e.isLeft(lowerSeries)) {
        return;
      }

      if (isMouseInDataRange(param.time)) {
        const currentUpperBar = param.seriesData.get(upperSeries.right) as LineData | null;
        const currentMiddleBar = param.seriesData.get(middleSeries.right) as LineData | null;
        const currentLowerBar = param.seriesData.get(lowerSeries.right) as LineData | null;
        setLegend({
          upper: formatLegend(currentUpperBar?.value),
          middle: formatLegend(currentMiddleBar?.value),
          lower: formatLegend(currentLowerBar?.value),
        });
      } else if (isMouseOffChart(param.point) && o.isSome(kcData)) {
        setLegend({
          upper: formatLegend(kcData.value.upper.at(-1)?.value),
          middle: formatLegend(kcData.value.middle.at(-1)?.value),
          lower: formatLegend(kcData.value.lower.at(-1)?.value),
        });
      } else {
        setLegend({ upper: 'n/a', middle: 'n/a', lower: 'n/a' });
      }
    },
    [kcData, _upperSeries, _middleSeries, _lowerSeries],
  );

  return o.isNone(kcData) ? (
    <div>Loading...</div>
  ) : (
    <>
      <Series
        ref={_upperSeries}
        type="Line"
        data={kcData.value.upper}
        options={upperSeriesOptions}
        crosshairMoveCb={updateLegend}
      />
      <Series ref={_middleSeries} type="Line" data={kcData.value.middle} options={middleSeriesOptions} />
      <Series ref={_lowerSeries} type="Line" data={kcData.value.lower} options={lowerSeriesOptions} />
      <Legend
        id={id}
        name={name}
        color={middleLineColor}
        legend={legend}
        hidden={hidden}
        handleToggleHidden={handleToggleHidden}
        handleRemoveSeries={handleRemoveSeries}
        handleSettingOpen={handleSettingOpen}
      />
      <SettingsModal
        open={settingOpen}
        onClose={handleClose}
        reset={reset}
        prevValue={getValues()}
        validSettings={trigger}
      >
        <SettingsForm control={control} />
      </SettingsModal>
    </>
  );
});

type LegendProps = {
  id: string;
  name: string;
  color: HexColor;
  legend: { upper: string; middle: string; lower: string };
  hidden: boolean;
  handleToggleHidden: MouseEventHandler<HTMLButtonElement>;
  handleRemoveSeries: (id: string) => void;
  handleSettingOpen: MouseEventHandler<HTMLButtonElement>;
};
function Legend(props: LegendProps) {
  const { id, name, color, legend, hidden, handleToggleHidden, handleRemoveSeries, handleSettingOpen } =
    props;

  return (
    <div className="group flex items-center space-x-1.5">
      <Typography className="font-medium" color={color}>
        {name}
      </Typography>
      <Typography className="group-hover:hidden">{legend.upper}</Typography>
      <Typography className="group-hover:hidden">{legend.middle}</Typography>
      <Typography className="group-hover:hidden">{legend.lower}</Typography>
      <div>
        <VisibilityButton hidden={hidden} toggleHidden={handleToggleHidden} />
        <SettingsButton openSettings={handleSettingOpen} />
        <RemoveButton objKey={id} remove={handleRemoveSeries} />
      </div>
    </div>
  );
}

function SettingsForm({ control }: { control: Control<KcSettings> }) {
  return (
    <form className="flex flex-col space-y-2 py-6">
      <div className="flex flex-col space-y-2">
        <NameField control={control} />
        <IntegerConfigField id="period" label="Period" name="period" control={control} />
        <IntegerConfigField id="stddev" label="StdDev" name="stddev" control={control} />
      </div>
      <Divider>Style</Divider>
      <div className="flex flex-col space-y-2 pt-2">
        <ColorField name="upperLineColor" labelId="upper-color" label="Upper line color" control={control} />
        <ColorField
          name="middleLineColor"
          labelId="middle-color"
          label="Middle line color"
          control={control}
        />
        <ColorField name="lowerLineColor" labelId="lower-color" label="Lower line color" control={control} />
      </div>
    </form>
  );
}
