import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { to2Digits, toLocale } from '#shared/utils/number';
import { mergeClassName } from '#shared/utils/tailwind';

import DownChip from './DownChip';
import Metric from './Metric';
import NeutralChip from './NeutralChip';
import UpChip from './UpChip';

type UpDownCardProps = {
  title: string;
  value: number;
  valueMaxDigits?: number;
  unit?: string;
  percentage?: number;
  className?: string;
};

export default function UpDownCard(props: UpDownCardProps) {
  const { title, value, valueMaxDigits, unit, percentage, className } = props;

  const Chip = value > 0 ? UpChip : value < 0 ? DownChip : NeutralChip;
  const color =
    value > 0
      ? 'shadow-emerald-200 dark:shadow-emerald-900'
      : value < 0
      ? 'shadow-rose-200 dark:shadow-rose-900'
      : 'shadow-gray-200 dark:shadow-gray-900';

  return (
    <Card
      className={mergeClassName(`flex min-h-min w-fit items-start gap-x-10 p-6 shadow-3 ${color}`, className)}
    >
      <div className="flex flex-grow flex-col gap-y-2">
        <Typography className="opacity-60">{title}</Typography>
        <Metric>{toLocale(value, valueMaxDigits)}</Metric>
      </div>
      <div className="flex h-full flex-col items-end justify-between">
        <Chip size="small" label={percentage !== undefined ? to2Digits(percentage) + '%' : undefined} />
        <Typography className="opacity-60">{unit}</Typography>
      </div>
    </Card>
  );
}
