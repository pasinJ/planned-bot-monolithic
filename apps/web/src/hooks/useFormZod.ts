import { FieldValues, UseFormProps, useForm } from 'react-hook-form';

export default function useFormZod<
  Fields extends FieldValues,
  TransformedFields extends FieldValues | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Context = any,
>(props: UseFormProps<Fields, Context>) {
  return useForm<Fields, Context, TransformedFields>(props);
}
