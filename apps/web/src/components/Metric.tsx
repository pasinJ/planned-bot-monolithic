import { TypographyProps } from '@mui/material';
import Typography from '@mui/material/Typography';
import { PropsWithChildren } from 'react';

export default function Metric(props: PropsWithChildren<TypographyProps>) {
  return <Typography className="font-medium" variant="h4" component="p" {...props} />;
}
