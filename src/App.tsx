import { useState, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { Layout } from './components/Layout';
import { CodeEditor } from './components/CodeEditor';
import { LinterOutput } from './components/LinterOutput';
import { Documentation } from './components/Documentation';

// Default example - Valid Kubernetes Deployment
const DEFAULT_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
`;

/**
 * Main App Component
 */
function App() {
  const [yamlCode, setYamlCode] = useState<string>(DEFAULT_YAML);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [showDocs, setShowDocs] = useState(false);

  // Validate YAML against backend
  const validateYaml = useCallback(async (code: string) => {
    if (!code.trim()) {
      setIsValid(null);
      setErrors([]);
      setWarnings([]);
      setDocumentCount(0);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ yaml: code }),
      });

      const data = await response.json();

      setIsValid(data.valid);
      setErrors(data.errors || []);
      setWarnings(data.warnings || []);
      setDocumentCount(data.documentCount || 0);

    } catch (error) {
      console.error('Validation error:', error);
      setIsValid(false);
      setErrors([{
        message: 'Failed to connect to validation server',
        details: 'Please ensure the backend server is running on port 3001',
        severity: 'error'
      }]);
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced validation (500ms delay)
  useEffect(() => {
    if (!showDocs) {
      const timer = setTimeout(() => {
        validateYaml(yamlCode);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [yamlCode, validateYaml, showDocs]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setYamlCode(value);
    }
  };

  // Export YAML to file
  const handleExport = () => {
    const blob = new Blob([yamlCode], { type: 'text/yaml;charset=utf-8' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    saveAs(blob, `k8s-manifest-${timestamp}.yaml`);
  };

  // Import YAML from file
  const handleImport = (content: string) => {
    setYamlCode(content);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlCode);
      console.log('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Layout
      onExport={handleExport}
      onImport={handleImport}
      onCopy={handleCopy}
      showDocs={showDocs}
      onToggleView={setShowDocs}
    >
      {/* Content */}
      {showDocs ? (
        <Documentation />
      ) : (
        <div className="flex w-full h-full">
          {/* Editor Pane - 50% width */}
          <div className="w-1/2 h-full">
            <CodeEditor value={yamlCode} onChange={handleEditorChange} />
          </div>

          {/* Output Pane - 50% width */}
          <div className="w-1/2 h-full">
            <LinterOutput
              isValid={isValid}
              errors={errors}
              warnings={warnings}
              loading={loading}
              documentCount={documentCount}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
