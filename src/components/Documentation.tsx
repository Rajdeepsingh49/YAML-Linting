import React from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PaletteIcon from '@mui/icons-material/Palette';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';

/**
 * Documentation Component - Full Screen Comprehensive Guide
 */
export const Documentation: React.FC = () => {
    return (
        <div className="w-full h-full overflow-y-auto bg-[var(--color-bg-card)]">
            <div className="max-w-6xl mx-auto px-8 py-12 space-y-12">
                {/* Header */}

                {/* Table of Contents */}
                <div className="glass p-8 rounded-2xl border border-[var(--glass-border)]">
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                        <DescriptionIcon /> Table of Contents
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-base">
                        <a href="#overview" className="text-[var(--color-blue)] hover:text-[var(--color-blue-light)] transition-colors flex items-center gap-2">
                            <span className="font-semibold">1.</span> Overview
                        </a>
                        <a href="#features" className="text-[var(--color-blue)] hover:text-[var(--color-blue-light)] transition-colors flex items-center gap-2">
                            <span className="font-semibold">2.</span> Features
                        </a>
                        <a href="#how-to-use" className="text-[var(--color-blue)] hover:text-[var(--color-blue-light)] transition-colors flex items-center gap-2">
                            <span className="font-semibold">3.</span> How to Use
                        </a>
                        <a href="#architecture" className="text-[var(--color-blue)] hover:text-[var(--color-blue-light)] transition-colors flex items-center gap-2">
                            <span className="font-semibold">4.</span> Architecture
                        </a>
                        <a href="#validation-engine" className="text-[var(--color-blue)] hover:text-[var(--color-blue-light)] transition-colors flex items-center gap-2">
                            <span className="font-semibold">5.</span> Validation Engine
                        </a>
                        <a href="#code-structure" className="text-[var(--color-blue)] hover:text-[var(--color-blue-light)] transition-colors flex items-center gap-2">
                            <span className="font-semibold">6.</span> Code Structure
                        </a>
                    </div>
                </div>

                {/* Overview Section */}
                <section id="overview" className="glass p-10 rounded-2xl border border-[var(--glass-border)]">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                        <CloudIcon fontSize="large" /> Overview
                    </h2>
                    <div className="space-y-6 text-[var(--color-text-secondary)] text-base">
                        <p className="leading-relaxed">
                            The <span className="font-semibold text-[var(--color-text-primary)]">Kubernetes YAML Linter</span> is a production-ready web application designed to validate Kubernetes manifests in real-time. It provides comprehensive schema checking, security analysis, and best practices recommendations to help developers write better Kubernetes configurations.
                        </p>
                        <div className="grid grid-cols-3 gap-6 mt-8">
                            <div className="bg-[var(--color-blue)]/10 p-6 rounded-xl border border-[var(--color-blue)]/20">
                                <div className="text-4xl font-bold text-[var(--color-blue)] mb-3">12+</div>
                                <div className="text-sm text-[var(--color-text-tertiary)]">Resource Types</div>
                            </div>
                            <div className="bg-[var(--color-green)]/10 p-6 rounded-xl border border-[var(--color-green)]/20">
                                <div className="text-4xl font-bold text-[var(--color-green)] mb-3">500ms</div>
                                <div className="text-sm text-[var(--color-text-tertiary)]">Validation Speed</div>
                            </div>
                            <div className="bg-[var(--color-purple)]/10 p-6 rounded-xl border border-[var(--color-purple)]/20">
                                <div className="text-4xl font-bold text-[var(--color-purple)] mb-3">100%</div>
                                <div className="text-sm text-[var(--color-text-tertiary)]">Real-Time</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="glass p-10 rounded-2xl border border-[var(--glass-border)]">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
                        <FlashOnIcon fontSize="large" /> Key Features
                    </h2>
                    <div className="grid grid-cols-2 gap-8">
                        {[
                            { Icon: SpeedIcon, title: 'Real-Time Validation', desc: '500ms debounced validation as you type' },
                            { Icon: SecurityIcon, title: 'Security Checks', desc: 'Detects privileged containers and security risks' },
                            { Icon: CheckCircleIcon, title: 'Best Practices', desc: 'Recommends resource limits and health probes' },
                            { Icon: SaveAltIcon, title: 'Export/Import', desc: 'Save and load YAML files with one click' },
                            { Icon: PaletteIcon, title: 'Modern UI', desc: 'Dark theme with glassmorphism effects' },
                            { Icon: FlashOnIcon, title: 'Fast & Efficient', desc: 'Instant feedback with minimal latency' },
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-[var(--color-bg-tertiary)] p-6 rounded-xl border border-[var(--glass-border)] hover:border-[var(--color-blue)]/30 transition-colors">
                                <feature.Icon className="text-[var(--color-blue)] mb-4" fontSize="large" />
                                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-3">{feature.title}</h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How to Use Section */}
                <section id="how-to-use" className="glass p-10 rounded-2xl border border-[var(--glass-border)]">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
                        <DescriptionIcon fontSize="large" /> How to Use
                    </h2>
                    <div className="space-y-8">
                        <div className="border-l-4 border-[var(--color-blue)] pl-8">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">
                                Step 1: Enter Your YAML
                            </h3>
                            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                                Paste or type your Kubernetes manifest in the left editor panel. The Monaco editor provides syntax highlighting and auto-completion for YAML.
                            </p>
                        </div>

                        <div className="border-l-4 border-[var(--color-green)] pl-8">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">
                                Step 2: Review Validation Results
                            </h3>
                            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                                See real-time validation results on the right panel. Errors appear in red, warnings in orange. Each issue includes the field path, line number, and detailed explanation.
                            </p>
                        </div>

                        <div className="border-l-4 border-[var(--color-purple)] pl-8">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">
                                Step 3: Export or Import
                            </h3>
                            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                                Use the <span className="font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">Export</span> button to download your YAML, <span className="font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">Import</span> to load a file, or <span className="font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">Copy</span> to clipboard.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Architecture Section */}
                <section id="architecture" className="glass p-10 rounded-2xl border border-[var(--glass-border)]">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
                        <StorageIcon fontSize="large" /> Architecture
                    </h2>
                    <div className="space-y-8">
                        <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                            The application follows a modern client-server architecture with React frontend and Node.js backend.
                        </p>

                        <div className="bg-[var(--color-bg-tertiary)] p-8 rounded-xl font-mono text-sm space-y-2">
                            <div className="text-[var(--color-text-primary)]">┌─ Frontend (React + TypeScript)</div>
                            <div className="text-[var(--color-text-secondary)]">│  ├─ Layout Component (Header/Footer)</div>
                            <div className="text-[var(--color-text-secondary)]">│  ├─ CodeEditor (Monaco Editor)</div>
                            <div className="text-[var(--color-text-secondary)]">│  └─ LinterOutput (Results Display)</div>
                            <div className="text-[var(--color-text-primary)] mt-4">└─ Backend (Node.js + Express)</div>
                            <div className="text-[var(--color-text-secondary)]">   ├─ YAML Parser (js-yaml)</div>
                            <div className="text-[var(--color-text-secondary)]">   ├─ Validation Engine</div>
                            <div className="text-[var(--color-text-secondary)]">   └─ API Endpoint (/api/validate)</div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-[var(--color-blue)]/10 p-6 rounded-xl border border-[var(--color-blue)]/20">
                                <h4 className="text-base font-bold text-[var(--color-blue)] mb-4">Frontend Tech</h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                                    <li>• React 19 + TypeScript</li>
                                    <li>• Vite (Build Tool)</li>
                                    <li>• Tailwind CSS v3</li>
                                    <li>• Monaco Editor</li>
                                    <li>• Material-UI Icons</li>
                                </ul>
                            </div>
                            <div className="bg-[var(--color-purple)]/10 p-6 rounded-xl border border-[var(--color-purple)]/20">
                                <h4 className="text-base font-bold text-[var(--color-purple)] mb-4">Backend Tech</h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                                    <li>• Node.js + Express</li>
                                    <li>• js-yaml Parser</li>
                                    <li>• Custom Validation</li>
                                    <li>• CORS Enabled</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Validation Engine Section */}
                <section id="validation-engine" className="glass p-10 rounded-2xl border border-[var(--glass-border)]">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
                        <CodeIcon fontSize="large" /> Validation Engine
                    </h2>
                    <div className="space-y-8">
                        <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                            The validation engine performs comprehensive checks across multiple dimensions:
                        </p>

                        <div className="space-y-6">
                            <div className="bg-[var(--color-red)]/10 p-6 rounded-xl border border-[var(--color-red)]/20">
                                <h4 className="text-base font-bold text-[var(--color-red)] mb-4 flex items-center gap-2">
                                    <WarningIcon /> Schema Validation (Errors)
                                </h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                                    <li>• Required fields (apiVersion, kind, metadata)</li>
                                    <li>• Field types and data structures</li>
                                    <li>• Label selector matching</li>
                                    <li>• Container specifications</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--color-orange)]/10 p-6 rounded-xl border border-[var(--color-orange)]/20">
                                <h4 className="text-base font-bold text-[var(--color-orange)] mb-4 flex items-center gap-2">
                                    <SecurityIcon /> Security Checks (Warnings)
                                </h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                                    <li>• Privileged container detection</li>
                                    <li>• Host network usage</li>
                                    <li>• Latest image tag usage</li>
                                    <li>• Security context analysis</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--color-orange)]/10 p-6 rounded-xl border border-[var(--color-orange)]/20">
                                <h4 className="text-base font-bold text-[var(--color-orange)] mb-4 flex items-center gap-2">
                                    <CheckCircleIcon /> Best Practices (Warnings)
                                </h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                                    <li>• Resource limits and requests</li>
                                    <li>• Liveness and readiness probes</li>
                                    <li>• High availability (replicas ≥ 2)</li>
                                    <li>• Label recommendations</li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-[var(--color-bg-tertiary)] p-6 rounded-xl">
                            <h4 className="text-base font-bold text-[var(--color-text-primary)] mb-4">Supported Resource Types</h4>
                            <div className="grid grid-cols-4 gap-3 text-sm text-[var(--color-text-secondary)]">
                                <div>• Deployment</div>
                                <div>• Service</div>
                                <div>• Pod</div>
                                <div>• StatefulSet</div>
                                <div>• DaemonSet</div>
                                <div>• ConfigMap</div>
                                <div>• Secret</div>
                                <div>• Ingress</div>
                                <div>• PVC</div>
                                <div>• Namespace</div>
                                <div>• Job</div>
                                <div>• CronJob</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Code Structure Section */}
                <section id="code-structure" className="glass p-10 rounded-2xl border border-[var(--glass-border)]">
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
                        <CodeIcon fontSize="large" /> Code Structure
                    </h2>
                    <div className="space-y-8">
                        <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                            The codebase is organized into clear, maintainable modules:
                        </p>

                        <div className="bg-[var(--color-bg-tertiary)] p-8 rounded-xl font-mono text-sm space-y-1">
                            <div className="text-[var(--color-blue)]">k8s-yaml-lint/</div>
                            <div className="text-[var(--color-text-secondary)]">├── src/</div>
                            <div className="text-[var(--color-text-secondary)]">│   ├── components/</div>
                            <div className="text-[var(--color-text-secondary)]">│   │   ├── Layout.tsx</div>
                            <div className="text-[var(--color-text-secondary)]">│   │   ├── CodeEditor.tsx</div>
                            <div className="text-[var(--color-text-secondary)]">│   │   ├── LinterOutput.tsx</div>
                            <div className="text-[var(--color-text-secondary)]">│   │   └── Documentation.tsx</div>
                            <div className="text-[var(--color-text-secondary)]">│   ├── App.tsx</div>
                            <div className="text-[var(--color-text-secondary)]">│   ├── index.css</div>
                            <div className="text-[var(--color-text-secondary)]">│   └── main.tsx</div>
                            <div className="text-[var(--color-text-secondary)]">├── server/</div>
                            <div className="text-[var(--color-text-secondary)]">│   └── index.js</div>
                            <div className="text-[var(--color-text-secondary)]">├── package.json</div>
                            <div className="text-[var(--color-text-secondary)]">└── DOCUMENTATION.md</div>
                        </div>

                        <div className="space-y-6">
                            <div className="border-l-4 border-[var(--color-blue)] pl-6">
                                <h4 className="text-base font-bold text-[var(--color-text-primary)] mb-3">Layout.tsx</h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Main layout component with header, footer, and export/import functionality. Handles file operations and dialog management.
                                </p>
                            </div>

                            <div className="border-l-4 border-[var(--color-green)] pl-6">
                                <h4 className="text-base font-bold text-[var(--color-text-primary)] mb-3">CodeEditor.tsx</h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Monaco editor wrapper with custom dark theme, YAML syntax highlighting, and editor configuration.
                                </p>
                            </div>

                            <div className="border-l-4 border-[var(--color-purple)] pl-6">
                                <h4 className="text-base font-bold text-[var(--color-text-primary)] mb-3">LinterOutput.tsx</h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Displays validation results with glassmorphism cards, color-coded severity, and detailed error information.
                                </p>
                            </div>

                            <div className="border-l-4 border-[var(--color-orange)] pl-6">
                                <h4 className="text-base font-bold text-[var(--color-text-primary)] mb-3">server/index.js</h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    Express server with validation engine. Contains all validation logic, security checks, and best practices recommendations.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <div className="text-center py-12 border-t border-[var(--glass-border)]">
                    <p className="text-base text-[var(--color-text-tertiary)]">
                        Built with ❤️ using React, TypeScript, and Node.js
                    </p>
                </div>
            </div>
        </div>
    );
};
