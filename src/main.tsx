// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';           // ✅ KEEP - your main CSS
import App from './App.tsx';     // ✅ KEEP - your App component

// Extend the globalThis typing to include MonacoEnvironment so we don't need `any` or casts
declare global {
  interface GlobalThis {
    MonacoEnvironment?: {
      getWorker(moduleId: string, label: string): Worker;
    };
  }
}

// Attach typed MonacoEnvironment to globalThis
globalThis.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === 'yaml') {
      return new Worker(new URL('./yaml.worker.ts', import.meta.url), {
        type: 'module',
      });
    }
    return new Worker(new URL('./editor.worker.ts', import.meta.url), {
      type: 'module',
    });
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

export {};