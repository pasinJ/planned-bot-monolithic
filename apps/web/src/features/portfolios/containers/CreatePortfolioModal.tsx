import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';

import MaterialSymbol from '#components/MaterialSymbol';

import CreatePortfolioForm from './CreatePortfolioForm';

export default function CreatePortfolioModal() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);
  const handleClick = () => setOpen(true);

  return (
    <>
      <Button
        variant="contained"
        aria-label="open create portfolio form"
        startIcon={<MaterialSymbol symbol="add" />}
        onClick={handleClick}
      >
        Create portfolio
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="create-portfolio-modal"
        fullScreen={fullScreen}
      >
        <DialogTitle id="create-portfolio-modal" className="flex items-center justify-between">
          Create portfolio
          <IconButton aria-label="close create portfolio form" onClick={handleClose}>
            <MaterialSymbol symbol="close" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="flex flex-col sm:min-h-[310px] sm:min-w-[410px] sm:justify-center">
          <CreatePortfolioForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
