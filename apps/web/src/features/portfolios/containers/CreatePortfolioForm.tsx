import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { isNotNil, omit } from 'ramda';
import { useState } from 'react';
import { Form, FormSubmitHandler, useController, useForm } from 'react-hook-form';

import { DecimalField } from '#components/DecimalField';
import MaterialSymbol from '#components/MaterialSymbol';

import useCreatePortfolio from '../hooks/useCreatePortfolio';

type FormValues = { initialCapital: string; takerFee: string; makerFee: string };
const defaultValues = { initialCapital: '0.0', takerFee: '0.0', makerFee: '0.0' };

export default function CreatePortfolioForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const createPortfolio = useCreatePortfolio({ onSuccess: () => setIsSuccess(true) });
  const { control } = useForm({ defaultValues });
  const { field: initialCapitalField } = useController({ name: 'initialCapital', control });
  const { field: takerFeeField } = useController({ name: 'takerFee', control });
  const { field: makerFeeField } = useController({ name: 'makerFee', control });

  const handleSubmit: FormSubmitHandler<FormValues> = ({ data }) => createPortfolio.mutate(data);

  if (isSuccess) return <SuccessfulForm />;
  else {
    return (
      <>
        <ErrorMessage error={createPortfolio.error} />
        <Form control={control} onSubmit={handleSubmit} className="flex w-full flex-col gap-6 pt-4">
          <DecimalField
            id="initial-capital"
            label="Initial capital"
            InputProps={{ endAdornment: 'USDT' }}
            {...omit(['ref'], initialCapitalField)}
          />
          <DecimalField
            id="taker-fee"
            label="Taker trading fee"
            InputProps={{ endAdornment: '%' }}
            {...omit(['ref'], takerFeeField)}
          />
          <DecimalField
            id="maker-fee"
            label="Maker trading fee"
            InputProps={{ endAdornment: '%' }}
            {...omit(['ref'], makerFeeField)}
          />
          <LoadingButton
            aria-label="submit create portfolio"
            variant="contained"
            color="primary"
            type="submit"
            loading={createPortfolio.isLoading}
          >
            <Typography variant="inherit">Create</Typography>
          </LoadingButton>
        </Form>
      </>
    );
  }
}

function SuccessfulForm() {
  return (
    <div className="flex h-full flex-col place-items-center gap-6 px-4 pb-16">
      <MaterialSymbol symbol="check_circle" className="text-5xl text-success" />
      <Typography variant="body1" color="initial">
        Your portfolio has been successfully created.
      </Typography>
    </div>
  );
}

function ErrorMessage({ error }: { error: Error | null }) {
  return (
    <Collapse in={isNotNil(error)}>
      <Alert className="mb-2" severity="error">
        <Typography variant="body2">Something went wrong: {error?.name}</Typography>
      </Alert>
    </Collapse>
  );
}
