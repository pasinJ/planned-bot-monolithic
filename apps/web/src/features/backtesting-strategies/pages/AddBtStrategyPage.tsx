import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import AddBtStrategyForm from '../containers/AddBtStrategyForm';

export default function AddBtStrategyPage() {
  return (
    <Box className="flex flex-col">
      <Typography variant="h4" component="h1" className="font-medium">
        Add backtesting strategy
      </Typography>
      <Divider className="my-4" />
      <AddBtStrategyForm />
    </Box>
  );
}
