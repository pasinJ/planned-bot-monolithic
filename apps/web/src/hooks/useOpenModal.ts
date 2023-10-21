import { MouseEventHandler, useState } from 'react';

export default function useOpenModal(
  initialValue: boolean,
): [boolean, MouseEventHandler<HTMLButtonElement>, MouseEventHandler<HTMLButtonElement>] {
  const [open, setOpen] = useState(initialValue);

  const handleOpen: MouseEventHandler<HTMLButtonElement> = () => setOpen(true);
  const handleClose: MouseEventHandler<HTMLButtonElement> = () => setOpen(false);

  return [open, handleOpen, handleClose];
}
