import Button from '@mui/material/Button';
import { MouseEventHandler } from 'react';

import MaterialSymbol from '#components/MaterialSymbol';

export default function VisibilityButton({
  hidden,
  toggleHidden,
}: {
  hidden: boolean;
  toggleHidden: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Button
      color="inherit"
      aria-label={hidden ? 'show indicator' : 'hide indicator'}
      className="group-hover:revert hidden min-w-fit p-0"
      onClick={toggleHidden}
    >
      <MaterialSymbol className="px-1 text-2xl" symbol={hidden ? 'visibility_off' : 'visibility'} />
    </Button>
  );
}
