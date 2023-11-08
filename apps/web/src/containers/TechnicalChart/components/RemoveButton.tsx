import Button from '@mui/material/Button';

import MaterialSymbol from '#components/MaterialSymbol';

export default function RemoveButton<T>({ objKey, remove }: { objKey: T; remove: (key: T) => void }) {
  return (
    <Button
      color="inherit"
      aria-label="delete"
      className="group-hover:revert hidden min-w-fit p-0"
      onClick={() => remove(objKey)}
    >
      <MaterialSymbol className="px-1 text-2xl" symbol="delete" />
    </Button>
  );
}
