import Editor, { Monaco, OnChange, OnMount, OnValidate } from '@monaco-editor/react';
import { editor, languages } from 'monaco-editor';
import { isNotNil } from 'ramda';
import { forwardRef, useImperativeHandle, useRef } from 'react';

// eslint-disable-next-line import/default
import contextType from '../../../strategyExecutorContextTypes/dist/index.d.cts?raw';

function monacoSetup(monaco: Monaco) {
  //https://microsoft.github.io/monaco-editor/playground.html?source=v0.44.0#example-extending-language-services-configure-javascript-defaults

  // validation settings
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    diagnosticCodesToIgnore: [1375],
  });

  // compiler options
  const compilerOptions: languages.typescript.CompilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
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

type StrategyEditorProps = {
  language: string | undefined;
  value: string | undefined;
  wrapperProps: object | undefined;
  onValidate: OnValidate | undefined;
  onChange: OnChange | undefined;
};

const StrategyEditor = forwardRef<editor.IStandaloneCodeEditor | null, StrategyEditorProps>(
  function StrategyEditor(props, ref) {
    const { language, value, wrapperProps, onValidate, onChange } = props;

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    useImperativeHandle<editor.IStandaloneCodeEditor | null, editor.IStandaloneCodeEditor | null>(
      ref,
      () => editorRef.current,
      [],
    );
    const handleMount: OnMount = (monaco) => {
      editorRef.current = monaco;
    };

    return (
      <Editor
        theme="vs-dark"
        height="100%"
        width="100%"
        language={language}
        defaultValue=""
        value={value}
        wrapperProps={wrapperProps}
        options={{
          ariaLabel: 'strategy body editor',
          padding: { top: 16, bottom: 16 },
        }}
        beforeMount={monacoSetup}
        onMount={handleMount}
        onValidate={onValidate}
        onChange={onChange}
      />
    );
  },
);

export default StrategyEditor;
