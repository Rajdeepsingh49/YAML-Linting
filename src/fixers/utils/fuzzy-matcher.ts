/**
 * Fuzzy Matcher
 * Uses Levenshtein distance for fuzzy field name matching
 */

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create matrix
    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Find closest match from a list of candidates
 */
export function findClosestMatch(
    target: string,
    candidates: string[],
    maxDistance: number = 2
): { match: string; distance: number } | null {
    let closestMatch: string | null = null;
    let minDistance = Infinity;

    for (const candidate of candidates) {
        const distance = levenshteinDistance(target.toLowerCase(), candidate.toLowerCase());
        if (distance <= maxDistance && distance < minDistance) {
            minDistance = distance;
            closestMatch = candidate;
        }
    }

    return closestMatch ? { match: closestMatch, distance: minDistance } : null;
}

/**
 * Calculate confidence score based on Levenshtein distance
 */
export function calculateFuzzyConfidence(distance: number, targetLength: number): number {
    if (distance === 0) return 1.0;
    if (distance === 1) return 0.9;
    if (distance === 2) return 0.7;

    // For longer distances, use ratio
    const ratio = 1 - (distance / targetLength);
    return Math.max(0, ratio);
}

/**
 * Check if two strings are similar enough
 */
export function areSimilar(str1: string, str2: string, maxDistance: number = 2): boolean {
    return levenshteinDistance(str1, str2) <= maxDistance;
}
