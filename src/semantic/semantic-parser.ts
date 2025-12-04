/**
 * Semantic Parser
 * Core parser that understands Kubernetes YAML structure semantically
 */

import type { SemanticLine, FixerOptions } from './types.js';
import { ContextAnalyzer } from './context-analyzer.js';

export class SemanticParser {
    private contextAnalyzer: ContextAnalyzer;
    private lines: SemanticLine[] = [];
    private options: FixerOptions;

    constructor(options: Partial<FixerOptions> = {}) {
        this.contextAnalyzer = new ContextAnalyzer();
        this.options = {
            confidenceThreshold: options.confidenceThreshold ?? 0.8,
            aggressive: options.aggressive ?? false,
            maxIterations: options.maxIterations ?? 3,
            enableLearning: options.enableLearning ?? true,
            enableRelocation: options.enableRelocation ?? true,
            indentSize: options.indentSize ?? 2,
        };
    }

    /**
     * Parse YAML content into semantic lines
     */
    parse(yamlContent: string): SemanticLine[] {
        this.lines = [];
        const rawLines = yamlContent.split('\n');

        for (let i = 0; i < rawLines.length; i++) {
            const lineNumber = i + 1;
            const content = rawLines[i];

            // Skip if in block scalar
            if (this.contextAnalyzer.isInBlockScalar()) {
                const semanticLine: SemanticLine = {
                    lineNumber,
                    content,
                    indent: this.getIndent(content),
                    type: 'block-scalar',
                    isListItem: false,
                    hasColon: false,
                    children: [],
                };
                this.lines.push(semanticLine);
                this.contextAnalyzer.analyzeLine(lineNumber, content);
                continue;
            }

            // Analyze line
            const semanticLine = this.contextAnalyzer.analyzeLine(lineNumber, content);
            this.lines.push(semanticLine);
        }

        // Build parent-child relationships
        this.buildRelationships();

        return this.lines;
    }

    /**
     * Build parent-child relationships between lines
     */
    private buildRelationships(): void {
        const stack: SemanticLine[] = [];

        for (const line of this.lines) {
            // Skip blank lines and comments
            if (line.type === 'blank' || line.type === 'comment') {
                continue;
            }

            // Pop stack until we find the parent
            while (stack.length > 0 && line.indent <= stack[stack.length - 1].indent) {
                stack.pop();
            }

            // Set parent
            if (stack.length > 0) {
                line.parent = stack[stack.length - 1];
                stack[stack.length - 1].children.push(line);
            }

            // Push to stack if it can have children
            if (line.type === 'key-only' || line.type === 'key-value' || line.type === 'list-item') {
                stack.push(line);
            }
        }
    }

    /**
     * Get all lines
     */
    getLines(): SemanticLine[] {
        return this.lines;
    }

    /**
     * Get lines by type
     */
    getLinesByType(type: string): SemanticLine[] {
        return this.lines.filter(line => line.type === type);
    }

    /**
     * Get line by number
     */
    getLine(lineNumber: number): SemanticLine | undefined {
        return this.lines.find(line => line.lineNumber === lineNumber);
    }

    /**
     * Get context analyzer
     */
    getContextAnalyzer(): ContextAnalyzer {
        return this.contextAnalyzer;
    }

    /**
     * Get indent from line
     */
    private getIndent(line: string): number {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    /**
     * Find siblings of a line (same parent, same indent level)
     */
    findSiblings(line: SemanticLine): SemanticLine[] {
        return this.lines.filter(l =>
            l.parent === line.parent &&
            l.indent === line.indent &&
            l.lineNumber !== line.lineNumber &&
            l.type !== 'blank' &&
            l.type !== 'comment'
        );
    }

    /**
     * Find children of a line
     */
    findChildren(line: SemanticLine): SemanticLine[] {
        return line.children;
    }

    /**
     * Check if line has children
     */
    hasChildren(line: SemanticLine): boolean {
        return line.children.length > 0;
    }

    /**
     * Get next non-blank line
     */
    getNextNonBlankLine(lineNumber: number): SemanticLine | undefined {
        for (let i = lineNumber; i < this.lines.length; i++) {
            const line = this.lines[i];
            if (line.type !== 'blank' && line.type !== 'comment') {
                return line;
            }
        }
        return undefined;
    }

    /**
     * Get previous non-blank line
     */
    getPreviousNonBlankLine(lineNumber: number): SemanticLine | undefined {
        for (let i = lineNumber - 2; i >= 0; i--) {
            const line = this.lines[i];
            if (line.type !== 'blank' && line.type !== 'comment') {
                return line;
            }
        }
        return undefined;
    }

    /**
     * Check if a line matches Kubernetes field naming pattern
     */
    matchesFieldPattern(text: string): boolean {
        // camelCase, lowercase, or hyphenated
        return /^[a-z][a-zA-Z0-9]*$/.test(text) || // camelCase or lowercase
            /^[a-z][a-z0-9-]*$/.test(text);     // hyphenated
    }

    /**
     * Get options
     */
    getOptions(): FixerOptions {
        return this.options;
    }

    /**
     * Reset parser
     */
    reset(): void {
        this.lines = [];
        this.contextAnalyzer.reset();
    }
}
