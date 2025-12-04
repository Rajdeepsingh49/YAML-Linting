/**
 * List Structure Fixer
 * Intelligently fixes broken list item structures
 */

import type { SemanticLine, FixSuggestion, FixerOptions } from '../semantic/types.js';
import { SemanticParser } from '../semantic/semantic-parser.js';

export class ListStructureFixer {
    private parser: SemanticParser;
    private options: FixerOptions;

    constructor(parser: SemanticParser, options: FixerOptions) {
        this.parser = parser;
        this.options = options;
    }

    /**
     * Find and fix broken list structures
     */
    findBrokenLists(): FixSuggestion[] {
        const fixes: FixSuggestion[] = [];
        const lines = this.parser.getLines();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip non-list items
            if (!line.isListItem) continue;

            // Check for broken env var structure
            const envFix = this.fixBrokenEnvVar(line);
            if (envFix && envFix.confidence >= this.options.confidenceThreshold) {
                fixes.push(envFix);
            }

            // Check for broken container structure
            const containerFix = this.fixBrokenContainer(line);
            if (containerFix && containerFix.confidence >= this.options.confidenceThreshold) {
                fixes.push(containerFix);
            }

            // Check for broken volume mount structure
            const volumeMountFix = this.fixBrokenVolumeMount(line);
            if (volumeMountFix && volumeMountFix.confidence >= this.options.confidenceThreshold) {
                fixes.push(volumeMountFix);
            }
        }

        return fixes;
    }

    /**
     * Fix broken env var structure
     * Pattern: "- DATABASE_URL" followed by "value: postgres://..."
     * Should be: "- name: DATABASE_URL\n  value: postgres://..."
     */
    private fixBrokenEnvVar(line: SemanticLine): FixSuggestion | null {
        const trimmed = line.content.trim();

        // Check if it's a simple list item (just "- SOMETHING")
        if (!trimmed.match(/^-\s+[A-Z_][A-Z0-9_]*$/)) {
            return null;
        }

        // Get next line
        const nextLine = this.parser.getNextNonBlankLine(line.lineNumber);
        if (!nextLine) return null;

        // Check if next line is "value:" or "valueFrom:"
        if (nextLine.key === 'value' || nextLine.key === 'valueFrom') {
            const envName = trimmed.substring(2).trim();
            const indent = ' '.repeat(line.indent);

            // Build fixed structure
            const fixed = `${indent}- name: ${envName}`;

            return {
                lineNumber: line.lineNumber,
                type: 'list-restructure',
                original: line.content,
                fixed,
                reason: `Restructuring broken env var "${envName}" to standard format`,
                confidence: 0.85,
                severity: 'error',
                metadata: { hasStandardPattern: true },
            };
        }

        return null;
    }

    /**
     * Fix broken container structure
     * Pattern: "- nginx" followed by "image: nginx:latest"
     * Should be: "- name: nginx\n  image: nginx:latest"
     */
    private fixBrokenContainer(line: SemanticLine): FixSuggestion | null {
        const trimmed = line.content.trim();

        // Check if it's a simple list item
        if (!trimmed.match(/^-\s+[a-z][a-z0-9-]*$/)) {
            return null;
        }

        // Get next line
        const nextLine = this.parser.getNextNonBlankLine(line.lineNumber);
        if (!nextLine) return null;

        // Check if next line is "image:"
        if (nextLine.key === 'image' && nextLine.indent > line.indent) {
            const containerName = trimmed.substring(2).trim();
            const indent = ' '.repeat(line.indent);

            const fixed = `${indent}- name: ${containerName}`;

            return {
                lineNumber: line.lineNumber,
                type: 'list-restructure',
                original: line.content,
                fixed,
                reason: `Restructuring broken container "${containerName}" to standard format`,
                confidence: 0.8,
                severity: 'error',
                metadata: { hasStandardPattern: true },
            };
        }

        return null;
    }

    /**
     * Fix broken volume mount structure
     */
    private fixBrokenVolumeMount(line: SemanticLine): FixSuggestion | null {
        const trimmed = line.content.trim();

        // Check if it's a simple list item
        if (!trimmed.match(/^-\s+[a-z][a-z0-9-]*$/)) {
            return null;
        }

        // Get next line
        const nextLine = this.parser.getNextNonBlankLine(line.lineNumber);
        if (!nextLine) return null;

        // Check if next line is "mountPath:"
        if (nextLine.key === 'mountPath' && nextLine.indent > line.indent) {
            const volumeName = trimmed.substring(2).trim();
            const indent = ' '.repeat(line.indent);

            const fixed = `${indent}- name: ${volumeName}`;

            return {
                lineNumber: line.lineNumber,
                type: 'list-restructure',
                original: line.content,
                fixed,
                reason: `Restructuring broken volume mount "${volumeName}" to standard format`,
                confidence: 0.8,
                severity: 'error',
                metadata: { hasStandardPattern: true },
            };
        }

        return null;
    }

    /**
     * Apply fixes to YAML content
     */
    applyFixes(yamlContent: string, fixes: FixSuggestion[]): string {
        const lines = yamlContent.split('\n');

        for (const fix of fixes) {
            if (fix.lineNumber > 0 && fix.lineNumber <= lines.length) {
                lines[fix.lineNumber - 1] = fix.fixed;
            }
        }

        return lines.join('\n');
    }
}
