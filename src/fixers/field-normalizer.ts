/**
 * Field Normalizer
 * Detects and corrects typos in field names using fuzzy matching
 */

import type { SemanticLine, FixSuggestion, FixerOptions } from '../semantic/types.js';
import { SemanticParser } from '../semantic/semantic-parser.js';
import { KNOWN_FIELDS, getCanonicalFieldName } from '../knowledge/field-patterns.js';
import { findClosestMatch, calculateFuzzyConfidence } from './utils/fuzzy-matcher.js';

export class FieldNormalizer {
    private parser: SemanticParser;
    private options: FixerOptions;
    private knownFieldsArray: string[];

    constructor(parser: SemanticParser, options: FixerOptions) {
        this.parser = parser;
        this.options = options;
        this.knownFieldsArray = Array.from(KNOWN_FIELDS);
    }

    /**
     * Find and fix field name typos
     */
    findTypos(): FixSuggestion[] {
        const fixes: FixSuggestion[] = [];
        const lines = this.parser.getLines();

        for (const line of lines) {
            // Skip if no key or is special line type
            if (!line.key || line.type === 'blank' || line.type === 'comment' || line.type === 'block-scalar') {
                continue;
            }

            // Check for typos
            const fix = this.detectTypo(line);
            if (fix && fix.confidence >= this.options.confidenceThreshold) {
                fixes.push(fix);
            }
        }

        return fixes;
    }

    /**
     * Detect typo in field name
     */
    private detectTypo(line: SemanticLine): FixSuggestion | null {
        const fieldName = line.key!;

        // Skip if already a known field
        if (KNOWN_FIELDS.has(fieldName)) {
            return null;
        }

        // Check for known aliases
        const canonical = getCanonicalFieldName(fieldName);
        if (canonical) {
            return this.createTypoFix(line, canonical, 0.9, 'Known alias');
        }

        // Use fuzzy matching to find closest known field
        const match = findClosestMatch(fieldName, this.knownFieldsArray, 2);
        if (match) {
            const confidence = calculateFuzzyConfidence(match.distance, fieldName.length);

            // Additional context check for high confidence
            if (this.isContextAppropriate(line, match.match)) {
                return this.createTypoFix(
                    line,
                    match.match,
                    Math.min(confidence + 0.1, 1.0),
                    `Likely typo (distance: ${match.distance})`
                );
            }

            return this.createTypoFix(
                line,
                match.match,
                confidence,
                `Possible typo (distance: ${match.distance})`
            );
        }

        return null;
    }

    /**
     * Check if suggested field is appropriate for current context
     */
    private isContextAppropriate(_line: SemanticLine, suggestedField: string): boolean {
        const path = this.parser.getContextAnalyzer().getCurrentPath();

        // Top-level fields
        if (path.length === 0) {
            return ['apiVersion', 'kind', 'metadata', 'spec', 'data', 'status'].includes(suggestedField);
        }

        // Metadata fields
        if (path.includes('metadata')) {
            return ['name', 'namespace', 'labels', 'annotations', 'uid', 'resourceVersion'].includes(suggestedField);
        }

        // Spec fields
        if (path.includes('spec')) {
            return true; // Most fields can be in spec
        }

        return true; // Default to true
    }

    /**
     * Create typo fix suggestion
     */
    private createTypoFix(
        line: SemanticLine,
        correctField: string,
        confidence: number,
        reason: string
    ): FixSuggestion {
        const indent = ' '.repeat(line.indent);
        const prefix = line.isListItem ? '- ' : '';
        const suffix = line.hasColon ? `:${line.value ? ' ' + line.value : ''}` : '';
        const fixed = `${indent}${prefix}${correctField}${suffix}`;

        return {
            lineNumber: line.lineNumber,
            type: 'field-normalization',
            original: line.content,
            fixed,
            reason: `${reason}: "${line.key}" → "${correctField}"`,
            confidence,
            severity: confidence >= 0.85 ? 'error' : 'warning',
        };
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
