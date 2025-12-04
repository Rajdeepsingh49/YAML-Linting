/**
 * Confidence Scorer
 * Calculates confidence scores for fixes
 */

import type { FixSuggestion, FixType } from '../semantic/types.js';

/**
 * Confidence scoring rules
 */
export const CONFIDENCE_RULES: Record<string, number> = {
    // High confidence (0.9-1.0)
    'known-field-missing-colon': 0.95,
    'known-alias': 0.9,
    'typo-distance-1': 0.9,

    // Medium-high confidence (0.8-0.9)
    'pattern-match-with-children': 0.85,
    'type-coercion-known-field': 0.85,
    'sibling-pattern-strong': 0.85,

    // Medium confidence (0.7-0.8)
    'pattern-match-with-value': 0.75,
    'typo-distance-2': 0.7,
    'structural-relocation': 0.75,

    // Lower confidence (0.6-0.7)
    'pattern-match-alone': 0.6,
    'orphaned-value-resolution': 0.65,
    'list-restructure': 0.7,
};

/**
 * Calculate overall confidence for a set of fixes
 */
export function calculateOverallConfidence(fixes: FixSuggestion[]): number {
    if (fixes.length === 0) return 1.0;

    // Weighted average based on severity
    const weights = {
        'critical': 1.5,
        'error': 1.0,
        'warning': 0.7,
        'info': 0.5,
    };

    let totalWeightedConfidence = 0;
    let totalWeight = 0;

    for (const fix of fixes) {
        const weight = weights[fix.severity];
        totalWeightedConfidence += fix.confidence * weight;
        totalWeight += weight;
    }

    return totalWeight > 0 ? totalWeightedConfidence / totalWeight : 1.0;
}

/**
 * Adjust confidence based on context
 */
export function adjustConfidenceByContext(
    baseConfidence: number,
    context: {
        hasKnownParent?: boolean;
        hasSimilarSiblings?: boolean;
        isTopLevel?: boolean;
        matchesSchema?: boolean;
    }
): number {
    let adjusted = baseConfidence;

    // Boost if parent is known
    if (context.hasKnownParent) {
        adjusted = Math.min(adjusted + 0.05, 1.0);
    }

    // Boost if siblings have similar structure
    if (context.hasSimilarSiblings) {
        adjusted = Math.min(adjusted + 0.1, 1.0);
    }

    // Boost if at top level (less ambiguity)
    if (context.isTopLevel) {
        adjusted = Math.min(adjusted + 0.05, 1.0);
    }

    // Boost if matches schema
    if (context.matchesSchema) {
        adjusted = Math.min(adjusted + 0.1, 1.0);
    }

    return adjusted;
}

/**
 * Filter fixes by confidence threshold
 */
export function filterByConfidence(
    fixes: FixSuggestion[],
    threshold: number
): FixSuggestion[] {
    return fixes.filter(fix => fix.confidence >= threshold);
}

/**
 * Sort fixes by confidence (descending)
 */
export function sortByConfidence(fixes: FixSuggestion[]): FixSuggestion[] {
    return [...fixes].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Group fixes by confidence level
 */
export function groupByConfidenceLevel(fixes: FixSuggestion[]): {
    high: FixSuggestion[];
    medium: FixSuggestion[];
    low: FixSuggestion[];
} {
    return {
        high: fixes.filter(f => f.confidence >= 0.85),
        medium: fixes.filter(f => f.confidence >= 0.7 && f.confidence < 0.85),
        low: fixes.filter(f => f.confidence < 0.7),
    };
}

/**
 * Calculate confidence for a specific fix type
 */
export function getConfidenceForFixType(
    fixType: FixType,
    metadata?: Record<string, any>
): number {
    switch (fixType) {
        case 'missing-colon':
            if (metadata?.isKnownField) return 0.95;
            if (metadata?.hasChildren) return 0.85;
            if (metadata?.matchesPattern) return 0.7;
            return 0.6;

        case 'field-normalization':
            if (metadata?.distance === 1) return 0.9;
            if (metadata?.distance === 2) return 0.7;
            if (metadata?.isAlias) return 0.9;
            return 0.6;

        case 'type-coercion':
            if (metadata?.isKnownField) return 0.85;
            return 0.7;

        case 'indentation':
            if (metadata?.hasValidSiblings) return 0.9;
            return 0.75;

        case 'duplicate-key':
            return 0.95; // High confidence for duplicate removal

        case 'field-relocation':
            if (metadata?.matchesSchema) return 0.8;
            return 0.65;

        case 'list-restructure':
            if (metadata?.hasStandardPattern) return 0.8;
            return 0.65;

        case 'orphaned-value':
            if (metadata?.hasObviousParent) return 0.75;
            return 0.6;

        default:
            return 0.5;
    }
}
