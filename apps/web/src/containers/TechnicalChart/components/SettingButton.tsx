import Button from '@mui/material/Button';
import { MouseEventHandler } from 'react';

import MaterialSymbol from '#components/MaterialSymbol';

export default function SettingsButton({
  openSettings,
}: {
  openSettings: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Button
      color="inherit"
      aria-label="open indicator settings"
      className="group-hover:revert hidden min-w-fit p-0"
      onClick={openSettings}
    >
      <MaterialSymbol className="px-1 text-2xl" symbol="settings" />
    </Button>
  );
}
