/**
 * Indentation Tracker
 * Maintains indent stack and parent-child relationships
 */

import type { IndentLevel } from './types.js';

export class IndentationTracker {
    private indentStack: IndentLevel[] = [];
    private currentIndent: number = 0;

    /**
     * Process a new line and update indent stack
     */
    processLine(_lineNumber: number, content: string, indent: number): void {
        // Handle document separator
        if (content.trim() === '---') {
            this.reset();
            return;
        }

        // Update current indent
        this.currentIndent = indent;

        // Pop stack if indent decreased
        while (this.indentStack.length > 0 && indent <= this.indentStack[this.indentStack.length - 1].indent) {
            this.indentStack.pop();
        }
    }

    /**
     * Push a new level onto the stack
     */
    push(indent: number, key: string, type: 'object' | 'array', lineNumber: number): void {
        this.indentStack.push({ indent, key, type, lineNumber });
    }

    /**
     * Get current parent key
     */
    getCurrentParent(): string | undefined {
        if (this.indentStack.length === 0) return undefined;
        return this.indentStack[this.indentStack.length - 1].key;
    }

    /**
     * Get full path from root to current position
     */
    getCurrentPath(): string[] {
        return this.indentStack.map(level => level.key);
    }

    /**
     * Get current indent level
     */
    getCurrentIndent(): number {
        return this.currentIndent;
    }

    /**
     * Get expected indent for a child of current level
     */
    getExpectedChildIndent(indentSize: number = 2): number {
        if (this.indentStack.length === 0) return 0;
        return this.indentStack[this.indentStack.length - 1].indent + indentSize;
    }

    /**
     * Check if we're inside an array
     */
    isInArray(): boolean {
        return this.indentStack.some(level => level.type === 'array');
    }

    /**
     * Get depth of current position
     */
    getDepth(): number {
        return this.indentStack.length;
    }

    /**
     * Reset the tracker (for new document)
     */
    reset(): void {
        this.indentStack = [];
        this.currentIndent = 0;
    }

    /**
     * Get the indent stack (for debugging)
     */
    getStack(): IndentLevel[] {
        return [...this.indentStack];
    }

    /**
     * Check if indent is valid for current context
     */
    isValidIndent(indent: number, indentSize: number = 2): boolean {
        if (this.indentStack.length === 0) {
            return indent === 0;
        }

        const parentIndent = this.indentStack[this.indentStack.length - 1].indent;
        const expectedChild = parentIndent + indentSize;
        const expectedSibling = parentIndent;

        // Valid if it's a child or sibling
        return indent === expectedChild || indent === expectedSibling;
    }

    /**
     * Calculate correct indent for a line based on context
     */
    calculateCorrectIndent(isChild: boolean, indentSize: number = 2): number {
        if (this.indentStack.length === 0) return 0;

        const parentIndent = this.indentStack[this.indentStack.length - 1].indent;

        if (isChild) {
            return parentIndent + indentSize;
        } else {
            return parentIndent;
        }
    }
}
