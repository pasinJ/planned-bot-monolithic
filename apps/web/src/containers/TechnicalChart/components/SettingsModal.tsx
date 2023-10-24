import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Modal, { ModalProps } from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import * as t from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/function';
import { MouseEventHandler } from 'react';
import { FieldValues, UseFormReset, UseFormTrigger } from 'react-hook-form';

import MaterialSymbol from '#components/MaterialSymbol';
import { executeT, ioVoid } from '#shared/utils/fp';

type SettingsModalProps<T extends FieldValues> = ModalProps & {
  onClose: MouseEventHandler<HTMLButtonElement>;
  reset: UseFormReset<T>;
  prevValue: T;
  validSettings: UseFormTrigger<T>;
};
export default function SettingsModal<T extends FieldValues>(props: SettingsModalProps<T>) {
  const { children, reset, prevValue, validSettings, onClose, ...rest } = props;

  const handleResetThenClose: MouseEventHandler<HTMLButtonElement> = (e) => {
    reset(prevValue);
    return onClose(e);
  };
  const handleSaveSettings: MouseEventHandler<HTMLButtonElement> = (e) => {
    void pipe(
      validSettings,
      t.map((isValid) => (isValid ? onClose(e) : ioVoid())),
      executeT,
    );
  };

  return (
    <Modal {...rest} onClose={handleResetThenClose}>
      <div className="absolute left-1/2 top-1/2 min-w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-1 p-4 shadow-4">
        <div className="ml-2 flex items-center justify-between">
          <Typography variant="h5" component="h1" className="font-medium">
            Settings
          </Typography>
          <IconButton color="inherit" onClick={handleResetThenClose}>
            <MaterialSymbol className="text-3xl" symbol="close" />
          </IconButton>
        </div>
        <Divider className="bg-gray-300" />
        {children}
        <Divider className="bg-gray-300" />
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outlined" onClick={handleResetThenClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveSettings}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
