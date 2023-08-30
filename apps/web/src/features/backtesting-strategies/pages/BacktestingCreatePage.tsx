import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import CreateBacktestingStrategyForm from '../containers/CreateBacktestingStrategyForm';

export default function BacktestingCreatePage() {
  return (
    <Box className="flex flex-col">
      <Typography variant="h4" component="h1" className="font-medium">
        Create backtesting strategy
      </Typography>
      <Divider className="my-4" />
      <CreateBacktestingStrategyForm />
    </Box>
  );
}
