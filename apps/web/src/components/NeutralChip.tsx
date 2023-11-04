import Chip, { ChipProps } from '@mui/material/Chip';

import MaterialSymbol from './MaterialSymbol';

export default function NeutralChip(props: ChipProps) {
  return props.label ? (
    <Chip
      className="bg-gray-500 bg-opacity-20 text-gray-500"
      icon={<MaterialSymbol symbol="trending_flat" className="mb-0.5 font-light text-inherit" />}
      {...props}
    />
  ) : (
    <div className={`flex rounded-full bg-gray-500 bg-opacity-20 p-0.5 text-gray-500`}>
      <MaterialSymbol
        symbol="trending_flat"
        className="mb-[1px] mr-[1px] text-[1.125rem] font-normal text-inherit"
      />
    </div>
  );
}
