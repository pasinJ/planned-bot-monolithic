import Typography from '@mui/material/Typography';
import { PropsWithChildren } from 'react';

type SeriesLegendWithoutMenusProps = PropsWithChildren<{ name: string; color?: string }>;
export default function SeriesLegendWithoutMenus(props: SeriesLegendWithoutMenusProps) {
  const { children, name, color } = props;

  return (
    <div className="flex space-x-1.5">
      <Typography className="font-medium" color={color ?? '#000000'}>
        {name}
      </Typography>
      {children}
    </div>
  );
}
