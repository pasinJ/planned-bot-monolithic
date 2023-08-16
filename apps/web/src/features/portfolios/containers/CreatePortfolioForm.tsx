import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { isNil, omit } from 'ramda';
import { useState } from 'react';
import { Form, FormSubmitHandler, useController, useForm } from 'react-hook-form';

import { DecimalField } from '#components/DecimalField';

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
        <Form control={control} onSubmit={handleSubmit}>
          <DecimalField
            id="initial-capital"
            label="Initial capital"
            {...omit(['ref'], initialCapitalField)}
          />
          <DecimalField id="taker-fee" label="Taker trading fee" {...omit(['ref'], takerFeeField)} />
          <DecimalField id="maker-fee" label="Maker trading fee" {...omit(['ref'], makerFeeField)} />
          <Button aria-label="submit create portfolio" variant="contained" color="primary" type="submit">
            Create
          </Button>
        </Form>
      </>
    );
  }
}

function SuccessfulForm() {
  return (
    <div>
      <Typography variant="body1" color="initial">
        Your portfolio has been successfully created.
      </Typography>
    </div>
  );
}

function ErrorMessage({ error }: { error: Error | null }) {
  if (isNil(error)) return null;
  else
    return (
      <Typography variant="body1" color="initial">
        Something went wrong: {error.name} {error.message}
      </Typography>
    );
}
