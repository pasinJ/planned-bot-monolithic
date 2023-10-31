import Chip, { ChipProps } from '@mui/material/Chip';

import MaterialSymbol from './MaterialSymbol';

export default function UpChip(props: ChipProps) {
  return props.label ? (
    <Chip
      className="bg-emerald-500 bg-opacity-20 text-emerald-500"
      icon={<MaterialSymbol symbol="trending_up" className="mb-0.5 font-light text-inherit" />}
      {...props}
    />
  ) : (
    <div className={`flex rounded-full bg-emerald-500 bg-opacity-20 p-0.5 text-emerald-500`}>
      <MaterialSymbol
        symbol="trending_up"
        className="mb-[1px] mr-[1px] text-[1.125rem] font-normal text-inherit"
      />
    </div>
  );
}
