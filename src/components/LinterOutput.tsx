import React from 'react';

interface ValidationError {
    message: string;
    field?: string;
    line?: number | null;
    column?: number | null;
    details?: string;
    severity?: 'error' | 'warning';
    kind?: string;
    document?: number;
}

interface LinterOutputProps {
    isValid: boolean | null;
    errors: ValidationError[];
    warnings: ValidationError[];
    loading: boolean;
    documentCount?: number;
}

/**
 * LinterOutput Component - Modern validation results display
 * Features: Glassmorphism cards, smooth animations, clear hierarchy
 */
export const LinterOutput: React.FC<LinterOutputProps> = ({
    isValid,
    errors,
    warnings,
    loading,
    documentCount = 0
}) => {
    // Loading state
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[var(--color-bg-card)] p-8">
                <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 border-4 border-[var(--color-blue)]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-[var(--color-blue)] rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] font-semibold">
                    Validating your manifest...
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                    Running comprehensive schema checks
                </p>
            </div>
        );
    }

    // Empty state
    if (isValid === null && errors.length === 0 && warnings.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[var(--color-bg-card)] p-8 text-center">
                <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-blue)]/20 to-[var(--color-purple)]/20 rounded-3xl blur-xl"></div>
                    <div className="relative w-20 h-20 glass rounded-3xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                    Ready to validate
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-sm leading-relaxed">
                    Start typing or paste your Kubernetes YAML manifest to see real-time validation results with comprehensive error detection.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[var(--color-bg-card)]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--color-bg-secondary)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                            Validation Results
                        </h2>
                        {documentCount > 0 && (
                            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                                {documentCount} document{documentCount > 1 ? 's' : ''} analyzed
                            </p>
                        )}
                    </div>

                    {/* Status Badge */}
                    {isValid ? (
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-green)] to-[var(--color-green-light)] rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                            <div className="relative flex items-center space-x-2 px-3 py-2 bg-[var(--color-green)]/10 border border-[var(--color-green)]/30 rounded-xl">
                                <svg className="w-4 h-4 text-[var(--color-green)]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-bold text-[var(--color-green)]">VALID</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-red)] to-[var(--color-red-light)] rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                            <div className="relative flex items-center space-x-2 px-3 py-2 bg-[var(--color-red)]/10 border border-[var(--color-red)]/30 rounded-xl">
                                <svg className="w-4 h-4 text-[var(--color-red)]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-bold text-[var(--color-red)]">
                                    {errors.length} ERROR{errors.length > 1 ? 'S' : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {/* Success State */}
                {isValid && errors.length === 0 && (
                    <div className="animate-scale-in">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-green)] to-[var(--color-green-light)] rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div className="relative glass p-5 rounded-2xl border border-[var(--color-green)]/20">
                                <div className="flex items-start">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-green)] to-[var(--color-green-light)] rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-[var(--color-green)] mb-1">
                                            No issues found
                                        </h3>
                                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                                            Your Kubernetes manifest is syntactically correct and adheres to all schema requirements and best practices.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Errors */}
                {errors.map((error, index) => (
                    <div
                        key={`error-${index}`}
                        className="animate-slide-in group"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-red)] to-[var(--color-red-light)] rounded-2xl blur-lg opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="relative glass p-5 rounded-2xl border border-[var(--color-red)]/20 hover:border-[var(--color-red)]/40 transition-all duration-200 cursor-pointer">
                                <div className="flex items-start">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-red)] to-[var(--color-red-light)] rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h3 className="text-sm font-bold text-[var(--color-red)] leading-tight">
                                                {error.message}
                                            </h3>
                                            {error.line && (
                                                <span className="text-xs font-mono font-semibold text-[var(--color-red)]/80 bg-[var(--color-red)]/10 px-2 py-1 rounded-lg flex-shrink-0 border border-[var(--color-red)]/20">
                                                    Line {error.line}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            {error.field && (
                                                <p className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded-lg inline-block">
                                                    {error.field}
                                                </p>
                                            )}
                                            {error.kind && (
                                                <p className="text-xs text-[var(--color-text-tertiary)]">
                                                    Resource: <span className="font-semibold text-[var(--color-text-secondary)]">{error.kind}</span>
                                                </p>
                                            )}
                                            {error.details && (
                                                <p className="text-xs font-mono text-[var(--color-text-secondary)] mt-2 p-3 bg-[var(--color-bg-tertiary)] rounded-lg break-all border border-[var(--glass-border)]">
                                                    {error.details}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Warnings */}
                {warnings.map((warning, index) => (
                    <div
                        key={`warning-${index}`}
                        className="animate-slide-in group"
                        style={{ animationDelay: `${(errors.length + index) * 50}ms` }}
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-orange-light)] rounded-2xl blur-lg opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="relative glass p-5 rounded-2xl border border-[var(--color-orange)]/20 hover:border-[var(--color-orange)]/40 transition-all duration-200 cursor-pointer">
                                <div className="flex items-start">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-orange-light)] rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h3 className="text-sm font-bold text-[var(--color-orange)] leading-tight">
                                                {warning.message}
                                            </h3>
                                            {warning.line && (
                                                <span className="text-xs font-mono font-semibold text-[var(--color-orange)]/80 bg-[var(--color-orange)]/10 px-2 py-1 rounded-lg flex-shrink-0 border border-[var(--color-orange)]/20">
                                                    Line {warning.line}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            {warning.field && (
                                                <p className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded-lg inline-block">
                                                    {warning.field}
                                                </p>
                                            )}
                                            {warning.kind && (
                                                <p className="text-xs text-[var(--color-text-tertiary)]">
                                                    Resource: <span className="font-semibold text-[var(--color-text-secondary)]">{warning.kind}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
