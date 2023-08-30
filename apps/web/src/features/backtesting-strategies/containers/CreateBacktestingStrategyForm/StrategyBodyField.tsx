import Editor from '@monaco-editor/react';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import { omit } from 'ramda';
import { useController } from 'react-hook-form';

import type { CreateBacktestingStrategyControl } from '.';

export function StrategyBodyField({ control }: { control: CreateBacktestingStrategyControl }) {
  const { field } = useController({ name: 'body', control });

  return (
    <FormControl>
      <Typography component="label" variant="body2" id="strategy-body-label" className="mb-2 text-gray-600">
        Strategy body
      </Typography>
      <Editor
        height="50vh"
        defaultLanguage="typescript"
        defaultValue=""
        theme="vs-dark"
        wrapperProps={{ 'aria-labelledby': 'strategy-body-label' }}
        options={{ ariaLabel: 'strategy body editor', padding: { top: 16, bottom: 16 } }}
        {...omit(['ref', 'onBlur'], field)}
      />
    </FormControl>
  );
}
