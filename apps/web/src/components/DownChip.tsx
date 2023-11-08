import Chip, { ChipProps } from '@mui/material/Chip';

import MaterialSymbol from './MaterialSymbol';

export default function DownChip(props: ChipProps) {
  const colorsClassName = 'bg-rose-300 bg-opacity-20 text-rose-500 dark:bg-rose-700 dark:text-rose-100';

  return props.label ? (
    <Chip
      className={colorsClassName}
      icon={<MaterialSymbol symbol="trending_down" className="mb-0.5 font-light text-inherit" />}
      {...props}
    />
  ) : (
    <div className={`flex rounded-full p-0.5 ${colorsClassName}`}>
      <MaterialSymbol
        symbol="trending_down"
        className="mb-[1px] mr-[1px] text-[1.125rem] font-normal text-inherit"
      />
    </div>
  );
}
