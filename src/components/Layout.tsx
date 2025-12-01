import React, { useState } from 'react';

interface LayoutProps {
    children: React.ReactNode;
    onExport: () => void;
    onImport: (content: string) => void;
    onCopy: () => void;
    showDocs: boolean;
    onToggleView: (showDocs: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onExport, onImport, onCopy, showDocs, onToggleView }) => {
    const [showImportDialog, setShowImportDialog] = useState(false);

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                onImport(content);
                setShowImportDialog(false);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)]">
            {/* Header with View Switcher */}
            <header className="relative glass border-b border-[var(--glass-border)] shadow-[var(--shadow-lg)] z-20">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-blue)]/5 to-[var(--color-purple)]/5"></div>
                <div className="relative max-w-screen-2xl mx-auto px-8 py-5">
                    <div className="flex items-center justify-between">
                        {/* View Switcher */}
                        <div className="glass rounded-xl p-1 flex space-x-1 border border-[var(--glass-border)] shadow-lg">
                            <button
                                onClick={() => onToggleView(false)}
                                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${!showDocs
                                        ? 'bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-purple)] text-white shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                    }`}
                            >
                                Linter
                            </button>
                            <button
                                onClick={() => onToggleView(true)}
                                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${showDocs
                                        ? 'bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-purple)] text-white shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                    }`}
                            >
                                Documentation
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3">
                            {/* Copy Button */}
                            <button
                                onClick={onCopy}
                                className="group relative px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/10"
                                title="Copy to clipboard"
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span>Copy</span>
                                </div>
                            </button>

                            {/* Import Button */}
                            <button
                                onClick={() => setShowImportDialog(true)}
                                className="group relative px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/10"
                                title="Import YAML file"
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>Import</span>
                                </div>
                            </button>

                            {/* Export Button */}
                            <button
                                onClick={onExport}
                                className="group relative overflow-hidden px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-purple)]"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-blue-light)] to-[var(--color-purple-light)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                <div className="relative flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Export YAML</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {children}
            </main>

            {/* Footer */}
            <footer className="glass border-t border-[var(--glass-border)] px-8 py-3 shadow-[var(--shadow-lg)]">
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <div className="w-2 h-2 bg-gradient-to-r from-[var(--color-green)] to-[var(--color-green-light)] rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-[var(--color-green)] rounded-full blur-sm"></div>
                            </div>
                            <span className="text-[var(--color-text-secondary)] font-semibold">
                                Connected
                            </span>
                        </div>
                        <div className="h-4 w-px bg-[var(--glass-border)]"></div>
                        <span className="text-[var(--color-text-tertiary)] font-medium">
                            Real-time validation active • 500ms debounce
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-[var(--color-text-tertiary)] font-medium">
                            Kubernetes API v1.29
                        </span>
                        <div className="h-4 w-px bg-[var(--glass-border)]"></div>
                        <span className="text-[var(--color-text-tertiary)] font-medium">
                            Enhanced Validation Engine v2.0
                        </span>
                    </div>
                </div>
            </footer>

            {/* Import Dialog */}
            {showImportDialog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
                    <div className="glass rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-white/10 animate-scale-in">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                                    Import YAML File
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Select a Kubernetes manifest file (.yaml or .yml) from your computer
                                </p>
                            </div>
                            <button
                                onClick={() => setShowImportDialog(false)}
                                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <label className="block">
                                <input
                                    type="file"
                                    accept=".yaml,.yml"
                                    onChange={handleFileImport}
                                    className="block w-full text-sm text-[var(--color-text-secondary)]
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-gradient-to-r file:from-[var(--color-blue)] file:to-[var(--color-purple)]
                    file:text-white
                    file:shadow-lg
                    hover:file:shadow-xl
                    file:transition-all
                    file:cursor-pointer
                    cursor-pointer
                    border-2 border-dashed border-[var(--glass-border)]
                    rounded-xl p-6
                    hover:border-[var(--color-blue)]/30
                    transition-colors"
                                />
                            </label>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => setShowImportDialog(false)}
                                    className="px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl transition-all duration-200 hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
