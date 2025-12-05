import express from 'express';
import { MultiPassFixer } from '../../src/semantic/intelligent-fixer.ts';

const router = express.Router();

/**
 * POST /api/yaml/validate
 * Unified endpoint for validating and fixing YAML.
 * 
 * Request body:
 * {
 *   content: string,
 *   options: {
 *     aggressive?: boolean,
 *     indentSize?: number
 *   }
 * }
 */
router.post('/validate', async (req, res) => {
    const startTime = process.hrtime.bigint();

    try {
        const { content, options = {} } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: content must be a non-empty string',
                fixed: '',
                errors: [],
                fixedCount: 0
            });
        }

        // Use the advanced MultiPassFixer
        const fixer = new MultiPassFixer({
            indentSize: options.indentSize || 2,
            aggressive: options.aggressive || false,
            confidenceThreshold: 0.6 // Lower threshold to catch more issues as requested
        });

        // Run the fix pipeline
        const fixResult = await fixer.fix(content);

        // Calculate timing
        const endTime = process.hrtime.bigint();
        const timeNanoseconds = endTime - startTime;
        const timeMilliseconds = Number(timeNanoseconds) / 1_000_000;
        const processingTime = Math.round(timeMilliseconds * 10) / 10;

        // Calculate detailed statistics for ValidationSummary
        const changes = fixResult.changes;
        const errors = fixResult.errors;

        const byCategory = { syntax: 0, structure: 0, semantic: 0, type: 0 };
        const bySeverity = { critical: 0, error: 0, warning: 0, info: 0 };
        const byConfidence = { high: 0, medium: 0, low: 0 };

        changes.forEach(change => {
            // Category
            const type = change.type.toLowerCase();
            if (byCategory[type] !== undefined) byCategory[type]++;
            else if (type.includes('syntax')) byCategory.syntax++;
            else if (type.includes('structure')) byCategory.structure++;
            else if (type.includes('semantic')) byCategory.semantic++;
            else if (type.includes('type')) byCategory.type++;
            else byCategory.semantic++; // Default

            // Severity
            if (bySeverity[change.severity] !== undefined) bySeverity[change.severity]++;

            // Confidence
            if (change.confidence >= 0.9) byConfidence.high++;
            else if (change.confidence >= 0.7) byConfidence.medium++;
            else byConfidence.low++;
        });

        const summary = {
            totalIssues: changes.length + errors.length,
            byCategory,
            bySeverity,
            byConfidence,
            parsingSuccess: fixResult.isValid,
            fixedCount: changes.length,
            remainingIssues: errors.length,
            overallConfidence: fixResult.confidence,
            processingTimeMs: processingTime
        };

        // Console logging for verification
        console.log('=== VALIDATION COMPLETE ===');
        console.log('Total issues:', summary.totalIssues);
        console.log('Fixed issues:', summary.fixedCount);
        console.log('Avg confidence:', (summary.overallConfidence * 100).toFixed(1) + '%');
        console.log('Processing time:', summary.processingTimeMs + 'ms');

        return res.json({
            success: true,
            originalValid: changes.length === 0 && errors.length === 0,
            fixed: fixResult.content,
            errors: errors.map(e => typeof e === 'string' ? { message: e, severity: 'error', line: 0, code: 'UNKNOWN', fixable: false } : e),
            fixedCount: changes.length,
            changes: changes,
            isValid: fixResult.isValid,
            summary: summary,
            confidence: fixResult.confidence
        });

    } catch (error) {
        console.error('YAML Validator API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            fixed: '',
            errors: [{
                line: 0,
                message: `Server error: ${error.message}`,
                severity: 'critical',
                code: 'SERVER_ERROR',
                fixable: false
            }]
        });
    }
});

export default router;
