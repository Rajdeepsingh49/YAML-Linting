/**
 * Context Analyzer
 * Understands current position in Kubernetes resource structure
 */

import type { ParsingContext, LineType, SemanticLine } from './types.js';
import { IndentationTracker } from './indentation-tracker.js';

export class ContextAnalyzer {
    private context: ParsingContext;
    private indentTracker: IndentationTracker;

    constructor() {
        this.indentTracker = new IndentationTracker();
        this.context = this.createEmptyContext();
    }

    /**
     * Analyze a line and update context
     */
    analyzeLine(lineNumber: number, content: string): SemanticLine {
        const trimmed = content.trim();
        const indent = this.getIndent(content);

        // Update indent tracker
        this.indentTracker.processLine(lineNumber, content, indent);

        // Classify line type
        const lineType = this.classifyLine(trimmed);
        const semanticLine: SemanticLine = {
            lineNumber,
            content,
            indent,
            type: lineType,
            isListItem: trimmed.startsWith('-'),
            hasColon: trimmed.includes(':'),
            children: [],
        };

        // Extract key and value if applicable
        if (lineType === 'key-value' || lineType === 'key-only') {
            this.extractKeyValue(semanticLine, trimmed);
        }

        // Update context based on line
        this.updateContext(semanticLine);

        return semanticLine;
    }

    /**
     * Classify line type
     */
    private classifyLine(trimmed: string): LineType {
        // Blank line
        if (trimmed === '') return 'blank';

        // Comment
        if (trimmed.startsWith('#')) return 'comment';

        // Document separator
        if (trimmed === '---' || trimmed === '...') return 'separator';

        // Block scalar
        if (trimmed === '|' || trimmed === '>' || trimmed === '|-' || trimmed === '>-') {
            return 'block-scalar';
        }

        // List item
        if (trimmed.startsWith('- ')) {
            // Check if it has a key-value structure
            const afterDash = trimmed.substring(2).trim();
            if (afterDash.includes(':')) {
                return 'list-item';
            }
            return 'list-item';
        }

        // Key-value pair
        if (trimmed.includes(':')) {
            const colonIndex = trimmed.indexOf(':');
            const afterColon = trimmed.substring(colonIndex + 1).trim();

            // Check if there's a value after colon
            if (afterColon === '' || afterColon.startsWith('#')) {
                return 'key-only';
            }
            return 'key-value';
        }

        // Single word (likely key without colon)
        if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmed)) {
            return 'key-only';
        }

        // Value only (orphaned)
        return 'value-only';
    }

    /**
     * Extract key and value from line
     */
    private extractKeyValue(line: SemanticLine, trimmed: string): void {
        if (trimmed.startsWith('- ')) {
            trimmed = trimmed.substring(2).trim();
        }

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex !== -1) {
            line.key = trimmed.substring(0, colonIndex).trim();
            line.value = trimmed.substring(colonIndex + 1).trim();
        } else {
            line.key = trimmed;
        }
    }

    /**
     * Update parsing context based on line
     */
    private updateContext(line: SemanticLine): void {
        // Detect resource type
        if (line.key === 'kind' && line.value) {
            this.context.resourceType = line.value;
        }

        // Detect API version
        if (line.key === 'apiVersion' && line.value) {
            this.context.apiVersion = line.value;
        }

        // Update current path
        this.context.currentPath = this.indentTracker.getCurrentPath();

        // Track block scalar
        if (line.type === 'block-scalar') {
            this.context.inBlockScalar = true;
            this.context.blockScalarIndent = line.indent;
        } else if (this.context.inBlockScalar && line.indent <= (this.context.blockScalarIndent || 0)) {
            this.context.inBlockScalar = false;
            this.context.blockScalarIndent = undefined;
        }

        // Update indent stack
        if (line.key && line.type !== 'value-only') {
            const type = line.isListItem ? 'array' : 'object';
            this.indentTracker.push(line.indent, line.key, type, line.lineNumber);
        }
    }

    /**
     * Get current context
     */
    getContext(): ParsingContext {
        return { ...this.context };
    }

    /**
     * Get indent tracker
     */
    getIndentTracker(): IndentationTracker {
        return this.indentTracker;
    }

    /**
     * Check if currently in block scalar
     */
    isInBlockScalar(): boolean {
        return this.context.inBlockScalar;
    }

    /**
     * Get current resource type
     */
    getResourceType(): string | undefined {
        return this.context.resourceType;
    }

    /**
     * Get current path
     */
    getCurrentPath(): string[] {
        return [...this.context.currentPath];
    }

    /**
     * Reset context (for new document)
     */
    reset(): void {
        this.context = this.createEmptyContext();
        this.indentTracker.reset();
    }

    /**
     * Create empty context
     */
    private createEmptyContext(): ParsingContext {
        return {
            currentPath: [],
            indentStack: [],
            inBlockScalar: false,
            documentIndex: 0,
        };
    }

    /**
     * Get indent from line
     */
    private getIndent(line: string): number {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    /**
     * Check if a field is expected at current path
     */
    isFieldExpectedHere(fieldName: string): boolean {
        const path = this.getCurrentPath();
        const resourceType = this.getResourceType();

        // Basic validation - can be enhanced with schema
        if (!resourceType) return true; // Can't validate without resource type

        // Common patterns
        if (fieldName === 'metadata' && path.length === 0) return true;
        if (fieldName === 'spec' && path.length === 0) return true;
        if (fieldName === 'containers' && path.includes('spec')) return true;
        if (fieldName === 'volumes' && path.includes('spec')) return true;

        return true; // Default to true for now
    }
}
