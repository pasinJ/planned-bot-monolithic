import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import { SwatchesPicker } from 'react-color';

import useOpenPopover from '#hooks/useOpenPopover';

type ColorPickerButtonProps = {
  'aria-labelledby': string;
  value: string;
  onChange: (...event: unknown[]) => void;
};
export default function ColorPickerButton(props: ColorPickerButtonProps) {
  const { value, onChange } = props;

  const [open, anchorElement, handleOpen, handleClose] = useOpenPopover();
  const popoverId = 'color-picker';

  return (
    <>
      <Button
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={open ? popoverId : undefined}
        variant="outlined"
        className="rounded-md p-2"
        onClick={handleOpen}
      >
        <div className="h-8 w-20 rounded-md" style={{ backgroundColor: value }} />
      </Button>
      <Popover
        id={popoverId}
        open={open}
        onClose={handleClose}
        anchorEl={anchorElement}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <SwatchesPicker height={300} width={540} color={value} onChange={(color) => onChange(color.hex)} />
      </Popover>
    </>
  );
}
