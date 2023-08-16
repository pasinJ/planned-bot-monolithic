import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';

import CreatePortfolioForm from './CreatePortfolioForm';

export default function CreatePortfolioModal() {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);
  const handleClick = () => setOpen(true);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        aria-label="open create portfolio form"
        onClick={handleClick}
      >
        Create portfolio
      </Button>
      <Dialog open={open} onClose={handleClose} aria-labelledby="create-portfolio-modal">
        <DialogTitle id="create-portfolio-modal">Create portfolio</DialogTitle>
        <IconButton aria-label="close create portfolio form" onClick={handleClose}>
          x
        </IconButton>
        <DialogContent>
          <CreatePortfolioForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
