import Editor from '@monaco-editor/react';

const QueryEditor = ({ value, onChange, readOnly = false, height = '200px', language = 'javascript' }) => {
  const handleEditorChange = (value) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-600">
      <Editor
        height={height}
        defaultLanguage={language}
        value={value}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
};

export default QueryEditor;
