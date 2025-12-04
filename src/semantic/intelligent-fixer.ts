/**
 * Intelligent YAML Fixer
 * Orchestrates semantic parsing and intelligent fixing
 */

import type { ValidationResult, FixSuggestion, FixerOptions } from '../semantic/types.js';
import { SemanticParser } from '../semantic/semantic-parser.js';
import { ContextAwareKeyFixer } from '../fixers/context-aware-key-fixer.js';
import { FieldNormalizer } from '../fixers/field-normalizer.js';
import { ListStructureFixer } from '../fixers/list-structure-fixer.js';
import { TypeCoercer } from '../fixers/type-coercer.js';
import { calculateOverallConfidence, filterByConfidence } from '../confidence/scorer.js';

export class IntelligentYAMLFixer {
    private options: FixerOptions;

    constructor(options: Partial<FixerOptions> = {}) {
        this.options = {
            confidenceThreshold: options.confidenceThreshold ?? 0.8,
            aggressive: options.aggressive ?? false,
            maxIterations: options.maxIterations ?? 3,
            enableLearning: options.enableLearning ?? true,
            enableRelocation: options.enableRelocation ?? true,
            indentSize: options.indentSize ?? 2,
        };

        // Lower threshold in aggressive mode
        if (this.options.aggressive) {
            this.options.confidenceThreshold = Math.min(this.options.confidenceThreshold, 0.6);
        }
    }

    /**
     * Analyze and fix YAML content
     */
    async fix(yamlContent: string): Promise<ValidationResult> {
        const allFixes: FixSuggestion[] = [];
        let currentYaml = yamlContent;
        let iteration = 0;

        // Iterative refinement
        while (iteration < this.options.maxIterations) {
            iteration++;

            // Parse YAML semantically
            const parser = new SemanticParser(this.options);
            parser.parse(currentYaml);

            // Collect fixes from all fixers
            const iterationFixes: FixSuggestion[] = [];

            // Phase 1: Context-aware key fixing
            const keyFixer = new ContextAwareKeyFixer(parser, this.options);
            const keyFixes = keyFixer.findMissingColons();
            iterationFixes.push(...keyFixes);

            // Phase 2: Field normalization (typo correction)
            const fieldNormalizer = new FieldNormalizer(parser, this.options);
            const normalizationFixes = fieldNormalizer.findTypos();
            iterationFixes.push(...normalizationFixes);

            // Phase 3: List structure fixing
            const listFixer = new ListStructureFixer(parser, this.options);
            const listFixes = listFixer.findBrokenLists();
            iterationFixes.push(...listFixes);

            // Phase 4: Type coercion
            const typeCoercer = new TypeCoercer(parser, this.options);
            const typeFixes = typeCoercer.findTypeMismatches();
            iterationFixes.push(...typeFixes);

            // Filter by confidence threshold
            const validFixes = filterByConfidence(iterationFixes, this.options.confidenceThreshold);

            // If no fixes found, we're done
            if (validFixes.length === 0) {
                break;
            }

            // Apply fixes
            currentYaml = this.applyFixes(currentYaml, validFixes);
            allFixes.push(...validFixes);

            // Try to parse with js-yaml to check if valid
            try {
                const yaml = await import('js-yaml');
                yaml.load(currentYaml);
                // If parsing succeeds, we're done
                break;
            } catch (error) {
                // Continue to next iteration
                continue;
            }
        }

        // Calculate overall confidence
        const overallConfidence = calculateOverallConfidence(allFixes);

        // Sort fixes by line number
        const sortedFixes = allFixes.sort((a, b) => a.lineNumber - b.lineNumber);

        // Try final parse to check validity
        let isValid = false;
        const errors: any[] = [];
        try {
            const yaml = await import('js-yaml');
            yaml.load(currentYaml);
            isValid = true;
        } catch (error: any) {
            errors.push({
                line: error.mark?.line || 0,
                message: error.message,
                severity: 'error',
            });
        }

        return {
            isValid,
            fixes: sortedFixes,
            errors,
            warnings: [],
            fixedYaml: currentYaml,
            confidence: overallConfidence,
        };
    }

    /**
     * Apply fixes to YAML content
     */
    private applyFixes(yamlContent: string, fixes: FixSuggestion[]): string {
        const lines = yamlContent.split('\n');

        // Sort fixes by line number (descending) to avoid line number shifts
        const sortedFixes = [...fixes].sort((a, b) => b.lineNumber - a.lineNumber);

        for (const fix of sortedFixes) {
            if (fix.lineNumber > 0 && fix.lineNumber <= lines.length) {
                lines[fix.lineNumber - 1] = fix.fixed;
            }
        }

        return lines.join('\n');
    }

    /**
     * Get current options
     */
    getOptions(): FixerOptions {
        return { ...this.options };
    }

    /**
     * Update options
     */
    setOptions(options: Partial<FixerOptions>): void {
        this.options = { ...this.options, ...options };
    }
}
