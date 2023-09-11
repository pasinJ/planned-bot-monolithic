import Editor, { OnValidate } from '@monaco-editor/react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import { MarkerSeverity } from 'monaco-editor';
import { useController, useWatch } from 'react-hook-form';

import type { AddBtStrategyControl } from '.';
import StrategyLanguageField from './StrategyLanguageField';

export default function StrategyBodyField({ control }: { control: AddBtStrategyControl }) {
  const { field, fieldState } = useController({
    name: 'body',
    control,
    rules: { required: 'Strategy body is required' },
  });
  const selectedLanguageValue = useWatch({ name: 'language', control });

  const labelId = 'strategy-body-label';

  const handleEditorMarker: OnValidate = (markers) => {
    // Monaco Marker Severity: Hint = 1, Info = 2, Warning = 4, Error = 8
    const errorMarker = markers.find((marker) => marker.severity === (8 as MarkerSeverity));
    if (errorMarker) control.setError('body', { type: 'value', message: 'Invalid syntax' });
  };

  return (
    <FormControl error={fieldState.invalid}>
      <Box className="flex flex-wrap justify-between gap-4">
        <Box className="flex min-w-[10rem] sm:flex-col">
          <InputLabel id={labelId} required className="relative mb-1 transform-none">
            Strategy body
          </InputLabel>
          <FormHelperText>{fieldState.invalid ? `(${fieldState.error?.message})` : ' '}</FormHelperText>
        </Box>
        <StrategyLanguageField control={control} />
      </Box>
      <Editor
        theme="vs-dark"
        height="50vh"
        defaultLanguage="javascript"
        language={selectedLanguageValue}
        defaultValue=""
        value={field.value}
        wrapperProps={{ 'aria-labelledby': labelId }}
        options={{
          ariaLabel: 'strategy body editor',
          padding: { top: 16, bottom: 16 },
        }}
        onValidate={handleEditorMarker}
        onChange={field.onChange}
      />
    </FormControl>
  );
}
