import { MouseEventHandler, useCallback, useState } from 'react';

export default function useOpenPopover(): [
  boolean,
  HTMLButtonElement | null,
  MouseEventHandler<HTMLButtonElement>,
  MouseEventHandler<HTMLButtonElement>,
] {
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);

  const handleOpen: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => setAnchorElement(e.currentTarget),
    [],
  );
  const handleClose: MouseEventHandler<HTMLButtonElement> = useCallback(() => setAnchorElement(null), []);

  const open = Boolean(anchorElement);

  return [open, anchorElement, handleOpen, handleClose];
}
