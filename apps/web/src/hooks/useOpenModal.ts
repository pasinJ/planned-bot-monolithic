import { MouseEventHandler, useCallback, useState } from 'react';

export default function useOpenModal(
  initialValue: boolean,
): [boolean, MouseEventHandler<HTMLButtonElement>, MouseEventHandler<HTMLButtonElement>] {
  const [open, setOpen] = useState(initialValue);

  const handleOpen: MouseEventHandler<HTMLButtonElement> = useCallback(() => setOpen(true), []);
  const handleClose: MouseEventHandler<HTMLButtonElement> = useCallback(() => setOpen(false), []);

  return [open, handleOpen, handleClose];
}
