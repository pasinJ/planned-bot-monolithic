import Typography from '@mui/material/Typography';

type SeriesLegendWithoutMenusProps = { name: string; color?: string; legend: string };
export default function SeriesLegendWithoutMenus(props: SeriesLegendWithoutMenusProps) {
  const { name, color, legend } = props;

  return (
    <div className="flex space-x-1.5">
      <Typography className="font-medium" color={color ?? '#000000'}>
        {name}
      </Typography>
      <Typography>{legend}</Typography>
    </div>
  );
}
