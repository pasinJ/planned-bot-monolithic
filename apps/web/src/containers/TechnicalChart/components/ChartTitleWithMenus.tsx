import Typography from '@mui/material/Typography';
import { MouseEventHandler } from 'react';

import RemoveButton from './RemoveButton';
import SettingsButton from './SettingButton';

type ChartTitleWithMenusProps<T extends string> = {
  title: string;
  chartType: T;
  handleOpenSettings: MouseEventHandler<HTMLButtonElement>;
  handleRemoveChart: (chartType: T) => void;
};
export default function ChartTitleWithMenus<T extends string>(props: ChartTitleWithMenusProps<T>) {
  const { title, chartType, handleRemoveChart, handleOpenSettings } = props;

  return (
    <div className="group flex items-center space-x-2">
      <Typography className="text-xl font-bold">{title}</Typography>
      <SettingsButton openSettings={handleOpenSettings} />
      <RemoveButton objKey={chartType} remove={handleRemoveChart} />
    </div>
  );
}
