/**
 * Context-Aware Key Fixer
 * Intelligently detects and fixes missing colons using semantic context
 */

import type { SemanticLine, FixSuggestion, FixerOptions } from '../semantic/types.js';
import { SemanticParser } from '../semantic/semantic-parser.js';
import { isKnownField, matchesKubernetesPattern } from '../knowledge/field-patterns.js';
import { getExpectedType } from '../knowledge/type-registry.js';

export class ContextAwareKeyFixer {
    private parser: SemanticParser;
    private options: FixerOptions;

    constructor(parser: SemanticParser, options: FixerOptions) {
        this.parser = parser;
        this.options = options;
    }

    /**
     * Find and fix missing colons
     */
    findMissingColons(): FixSuggestion[] {
        const fixes: FixSuggestion[] = [];
        const lines = this.parser.getLines();

        for (const line of lines) {
            // Skip if already has colon, is blank, or is comment
            if (line.hasColon || line.type === 'blank' || line.type === 'comment' || line.type === 'block-scalar') {
                continue;
            }

            // Check if this looks like a key without colon
            const fix = this.detectMissingColon(line);
            if (fix && fix.confidence >= this.options.confidenceThreshold) {
                fixes.push(fix);
            }
        }

        return fixes;
    }

    /**
     * Detect if a line is missing a colon
     */
    private detectMissingColon(line: SemanticLine): FixSuggestion | null {
        const trimmed = line.content.trim();

        // Handle list items
        if (trimmed.startsWith('- ')) {
            return this.detectMissingColonInListItem(line, trimmed);
        }

        // Handle regular keys
        return this.detectMissingColonInKey(line, trimmed);
    }

    /**
     * Detect missing colon in list item
     */
    private detectMissingColonInListItem(line: SemanticLine, trimmed: string): FixSuggestion | null {
        const afterDash = trimmed.substring(2).trim();

        // Pattern: "- name value" should be "- name: value"
        const parts = afterDash.split(/\s+/);
        if (parts.length >= 2) {
            const key = parts[0];
            const value = parts.slice(1).join(' ');

            // Check if key is a known field
            if (isKnownField(key)) {
                const indent = ' '.repeat(line.indent);
                const fixed = `${indent}- ${key}: ${value}`;

                return {
                    lineNumber: line.lineNumber,
                    type: 'missing-colon',
                    original: line.content,
                    fixed,
                    reason: `Missing colon after "${key}" in list item`,
                    confidence: 0.95,
                    severity: 'error',
                };
            }

            // Check if it matches pattern
            if (matchesKubernetesPattern(key)) {
                const indent = ' '.repeat(line.indent);
                const fixed = `${indent}- ${key}: ${value}`;

                return {
                    lineNumber: line.lineNumber,
                    type: 'missing-colon',
                    original: line.content,
                    fixed,
                    reason: `Likely missing colon after "${key}" in list item`,
                    confidence: 0.7,
                    severity: 'warning',
                };
            }
        }

        // Pattern: "- name" followed by indented content
        if (parts.length === 1) {
            const key = parts[0];
            const nextLine = this.parser.getNextNonBlankLine(line.lineNumber);

            if (nextLine && nextLine.indent > line.indent) {
                // This is a parent key
                const indent = ' '.repeat(line.indent);
                const fixed = `${indent}- ${key}:`;

                const confidence = isKnownField(key) ? 0.95 :
                    matchesKubernetesPattern(key) ? 0.75 : 0.6;

                return {
                    lineNumber: line.lineNumber,
                    type: 'missing-colon',
                    original: line.content,
                    fixed,
                    reason: `Missing colon after "${key}" (has child elements)`,
                    confidence,
                    severity: confidence >= 0.8 ? 'error' : 'warning',
                };
            }
        }

        return null;
    }

    /**
     * Detect missing colon in regular key
     */
    private detectMissingColonInKey(line: SemanticLine, trimmed: string): FixSuggestion | null {
        // Pattern 1: "key value" should be "key: value"
        const parts = trimmed.split(/\s+/);

        if (parts.length >= 2) {
            const key = parts[0];
            const value = parts.slice(1).join(' ');

            // Check if key is known
            if (isKnownField(key)) {
                const indent = ' '.repeat(line.indent);
                const fixed = `${indent}${key}: ${value}`;

                return {
                    lineNumber: line.lineNumber,
                    type: 'missing-colon',
                    original: line.content,
                    fixed,
                    reason: `Missing colon after known Kubernetes field "${key}"`,
                    confidence: 0.95,
                    severity: 'error',
                };
            }

            // Check if it matches pattern and has expected type
            if (matchesKubernetesPattern(key)) {
                const expectedType = getExpectedType(key);

                // If we know the type, check if value matches
                if (expectedType && expectedType !== 'object' && expectedType !== 'array') {
                    const indent = ' '.repeat(line.indent);
                    const fixed = `${indent}${key}: ${value}`;

                    return {
                        lineNumber: line.lineNumber,
                        type: 'missing-colon',
                        original: line.content,
                        fixed,
                        reason: `Missing colon after "${key}" (expects ${expectedType} value)`,
                        confidence: 0.85,
                        severity: 'error',
                    };
                }

                // Generic pattern match
                const indent = ' '.repeat(line.indent);
                const fixed = `${indent}${key}: ${value}`;

                return {
                    lineNumber: line.lineNumber,
                    type: 'missing-colon',
                    original: line.content,
                    fixed,
                    reason: `Likely missing colon after "${key}"`,
                    confidence: 0.7,
                    severity: 'warning',
                };
            }
        }

        // Pattern 2: "key" alone, followed by indented content
        if (parts.length === 1) {
            const key = parts[0];
            const nextLine = this.parser.getNextNonBlankLine(line.lineNumber);

            if (nextLine && nextLine.indent > line.indent) {
                // This is a parent key
                const indent = ' '.repeat(line.indent);
                const fixed = `${indent}${key}:`;

                let confidence = 0.6;
                if (isKnownField(key)) {
                    confidence = 0.95;
                } else if (matchesKubernetesPattern(key)) {
                    confidence = 0.75;
                }

                // Check if siblings have colons (pattern learning)
                const siblings = this.parser.findSiblings(line);
                const siblingsWithColons = siblings.filter(s => s.hasColon).length;
                if (siblings.length > 0 && siblingsWithColons / siblings.length > 0.8) {
                    confidence = Math.max(confidence, 0.85);
                }

                return {
                    lineNumber: line.lineNumber,
                    type: 'missing-colon',
                    original: line.content,
                    fixed,
                    reason: `Missing colon after "${key}" (has child elements)`,
                    confidence,
                    severity: confidence >= 0.8 ? 'error' : 'warning',
                };
            }
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
