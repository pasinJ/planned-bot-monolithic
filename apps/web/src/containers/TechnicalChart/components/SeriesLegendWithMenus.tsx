import Typography from '@mui/material/Typography';
import { MouseEventHandler, PropsWithChildren } from 'react';

import RemoveButton from './RemoveButton';
import SettingsButton from './SettingButton';
import VisibilityButton from './VisibilityButton';

type SeriesLegendWithMenus = PropsWithChildren<{
  id: string;
  title: string;
  color?: string;
  legend: JSX.Element;
  hidden: boolean;
  handleToggleHidden: MouseEventHandler<HTMLButtonElement>;
  handleRemoveSeries: (id: string) => void;
  handleSettingOpen: MouseEventHandler<HTMLButtonElement>;
}>;
export default function SeriesLegendWithMenus(props: SeriesLegendWithMenus) {
  const {
    id,
    title,
    color,
    legend,
    hidden,
    children,
    handleToggleHidden,
    handleRemoveSeries,
    handleSettingOpen,
  } = props;

  return (
    <div className="group flex items-center space-x-1.5">
      <Typography className="font-medium" color={color ?? '#000000'}>
        {title}
      </Typography>
      <Typography className="group-hover:hidden">{legend}</Typography>
      <div>
        <VisibilityButton hidden={hidden} toggleHidden={handleToggleHidden} />
        <SettingsButton openSettings={handleSettingOpen} />
        <RemoveButton objKey={id} remove={handleRemoveSeries} />
      </div>
      {children}
    </div>
  );
}
