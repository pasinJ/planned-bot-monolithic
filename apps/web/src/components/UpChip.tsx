import Chip, { ChipProps } from '@mui/material/Chip';

import MaterialSymbol from './MaterialSymbol';

export default function UpChip(props: ChipProps) {
  const colorClassName =
    'bg-emerald-300 bg-opacity-20 text-emerald-500 dark:bg-emerald-700 dark:text-emerald-100';
  return props.label ? (
    <Chip
      className={colorClassName}
      icon={<MaterialSymbol symbol="trending_up" className="mb-0.5 font-light text-inherit" />}
      {...props}
    />
  ) : (
    <div className={`flex rounded-full p-0.5 ${colorClassName}`}>
      <MaterialSymbol
        symbol="trending_up"
        className="mb-[1px] mr-[1px] text-[1.125rem] font-normal text-inherit"
      />
    </div>
  );
}
