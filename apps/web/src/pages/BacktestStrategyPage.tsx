import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import BacktestStrategyForm from '#features/backtesting-strategies/containers/BacktestStrategyForm';

const steps = ['General datails', 'Strategy details', 'Backtesting result'];

export default function BacktestStrategyPage() {
  const [activeStep, setActiveStep] = useState(0);

  const changeActiveStepTo = (step: number) => {
    return () => setActiveStep(step);
  };
  const moveToNextStep = () => setActiveStep((x) => (x !== steps.length - 1 ? x + 1 : x));
  const moveToPrevStep = () => setActiveStep((x) => (x !== 0 ? x - 1 : x));

  return (
    <Box className="flex flex-col">
      <Typography variant="h4" component="h1" className="font-medium">
        Backtest strategy
      </Typography>
      <Divider className="my-4" />
      <Stepper alternativeLabel activeStep={activeStep}>
        {steps.map((label, index) => (
          <Step key={index} completed={index < activeStep}>
            <StepButton onClick={changeActiveStepTo(index)}>
              <StepLabel>{label}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <div className="flex justify-center">
        <BacktestStrategyForm
          activeStep={activeStep}
          moveToPrevStep={moveToPrevStep}
          moveToNextStep={moveToNextStep}
        />
      </div>
    </Box>
  );
}
