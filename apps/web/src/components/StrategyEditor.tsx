import Editor, { Monaco, OnChange, OnValidate } from '@monaco-editor/react';
import { languages } from 'monaco-editor';
import { isNotNil } from 'ramda';

// eslint-disable-next-line import/default
import contextType from '../../../strategyExecutorContextTypes/dist/index.d.cts?raw';

function monacoSetup(monaco: Monaco) {
  //https://microsoft.github.io/monaco-editor/playground.html?source=v0.44.0#example-extending-language-services-configure-javascript-defaults

  // validation settings
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  // compiler options
  const compilerOptions: languages.typescript.CompilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    lib: ['es2016'],
  };
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);

  // extra libraries
  const content = contextType;
  const filePath = 'index.d.ts';
  monaco.languages.typescript.javascriptDefaults.addExtraLib(content, filePath);
  // When resolving definitions and references, the editor will try to use created models.
  // Creating a model for the library allows "peek definition/references" commands to work with the library.
  const contextModel = monaco.editor.getModel(monaco.Uri.parse(filePath));
  if (isNotNil(contextModel)) contextModel.dispose();
  monaco.editor.createModel(content, 'typescript', monaco.Uri.parse(filePath));
}

export function StrategyEditor(props: {
  language: string | undefined;
  value: string | undefined;
  wrapperProps: object | undefined;
  onValidate: OnValidate | undefined;
  onChange: OnChange | undefined;
}) {
  return (
    <Editor
      theme="vs-dark"
      height="50vh"
      language={props.language}
      defaultValue=""
      value={props.value}
      wrapperProps={props.wrapperProps}
      options={{
        ariaLabel: 'strategy body editor',
        padding: { top: 16, bottom: 16 },
      }}
      beforeMount={monacoSetup}
      onValidate={props.onValidate}
      onChange={props.onChange}
    />
  );
}
