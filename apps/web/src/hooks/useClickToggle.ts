import { MouseEventHandler, useState } from 'react';

export default function useClickToggle(
  initialValue: boolean,
): [boolean, MouseEventHandler<HTMLButtonElement>] {
  const [value, setValue] = useState(initialValue);

  const handleToggle: MouseEventHandler<HTMLButtonElement> = () => setValue((x) => !x);

  return [value, handleToggle];
}
