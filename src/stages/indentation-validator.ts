

export interface IndentOptions {
    style: '2' | '4' | 'auto';
    fixTrailingSpaces?: boolean;
    preserveComments?: boolean;
    mode?: 'all' | 'indentation' | 'syntax';
}

export interface ValidationError {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
    fixable: boolean;
    code: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    detectedStyle: number;
}

export interface FixResult {
    content: string;
    fixedCount: number;
    changes: { line: number; type: string; original: string; fixed: string }[];
}

export class IndentationValidator {
    /**
     * Detects the indentation style (2 or 4 spaces) of the content.
     * Defaults to 2 if ambiguous.
     */
    detectIndentationStyle(content: string): number {
        const lines = content.split('\n');
        const counts = { 2: 0, 4: 0 };

        for (const line of lines) {
            const match = line.match(/^(\s+)/);
            if (!match) continue;
            const spaces = match[1].length;
            if (spaces > 0) {
                if (spaces % 4 === 0) counts[4]++;
                if (spaces % 2 === 0) counts[2]++;
            }
        }

        // Prefer 2 spaces if it's a tie or ambiguous, as it's standard for K8s
        return counts[4] > counts[2] ? 4 : 2;
    }

    /**
     * Validates the indentation of the given YAML content.
     */
    validate(content: string, options: IndentOptions = { style: 'auto' }): ValidationResult {
        const errors: ValidationError[] = [];
        const lines = content.split('\n');
        const targetStyle = options.style === 'auto' ? this.detectIndentationStyle(content) : parseInt(options.style);

        let inMultilineString = false;
        let multilineIndent = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // 1. Detect Tabs
            if (line.includes('\t')) {
                errors.push({
                    line: lineNumber,
                    column: line.indexOf('\t') + 1,
                    message: 'Tab character detected. YAML forbids tabs.',
                    severity: 'error',
                    fixable: true,
                    code: 'TAB_DETECTED'
                });
            }

            // 2. Detect Trailing Whitespace
            if (line.match(/\s+$/)) {
                errors.push({
                    line: lineNumber,
                    column: line.length,
                    message: 'Trailing whitespace detected.',
                    severity: 'warning',
                    fixable: true,
                    code: 'TRAILING_WHITESPACE'
                });
            }

            // Skip empty lines or comments for indentation check
            if (line.trim().length === 0 || line.trim().startsWith('#')) {
                continue;
            }

            // Handle Multiline Strings (Basic state machine)
            // This is a simplified check. A full parser is better but slower.
            // We assume standard YAML block scalars | or >
            if (line.trim().endsWith('|') || line.trim().endsWith('>')) {
                inMultilineString = true;
                const match = line.match(/^(\s*)/);
                multilineIndent = match ? match[1].length : 0;
                continue; // The header line itself is checked below
            }

            const match = line.match(/^(\s*)/);
            const indent = match ? match[1].length : 0;

            if (inMultilineString) {
                // If line is less indented than the block start, we might be out of the block
                // But we need to be careful about empty lines in blocks
                if (indent <= multilineIndent && line.trim().length > 0) {
                    inMultilineString = false;
                } else {
                    // Inside multiline string, indentation rules are relaxed relative to parent
                    // but we generally don't validate strict levels here to avoid breaking content
                    continue;
                }
            }

            // 3. Check Indentation Level
            if (indent % targetStyle !== 0) {
                errors.push({
                    line: lineNumber,
                    column: 1,
                    message: `Incorrect indentation level: ${indent} spaces. Expected multiple of ${targetStyle}.`,
                    severity: 'error',
                    fixable: true,
                    code: 'INVALID_INDENTATION'
                });
            }

            // 4. Check List Alignment
            // List items "- " should be aligned.
            // This is complex to check perfectly without AST, but we can catch obvious ones.
            if (line.trim().startsWith('-')) {
                // The dash itself counts as indentation in some styles, but usually
                // we expect the dash to be at the correct indent level.
                // Already covered by general indent check above.
            }

            // 5. Check for Missing Colon After Key
            if (!line.trim().startsWith('#') && !line.trim().includes(':') && !line.trim().startsWith('-') && line.trim().length > 0) {
                const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
                const nextIndent = nextLine.match(/^(\s*)/)?.[1].length || 0;
                const currentIndent = match ? match[1].length : 0;

                const k8sKeys = ['metadata', 'spec', 'status', 'data', 'labels', 'annotations',
                    'selector', 'template', 'containers', 'ports', 'env', 'volumes'];
                const isKnownKey = k8sKeys.some(key => line.trim().toLowerCase().includes(key.toLowerCase()));

                if ((nextIndent > currentIndent && nextLine.trim().length > 0) || isKnownKey) {
                    errors.push({
                        line: lineNumber,
                        column: line.trim().length + 1,
                        message: `Missing colon after key. Expected '${line.trim()}:'`,
                        severity: 'error',
                        fixable: true,
                        code: 'MISSING_COLON'
                    });
                }
            }

            // 6. Check Colon Spacing
            // "key:value" is invalid, needs "key: value"
            // Exclude URLs (http://) and strings containing colons
            // Regex: Start of line, key (no spaces/colons), colon, NO space, then content
            const colonMatch = line.match(/^(\s*[^\s:]+):(?!\s)(\S)/);
            if (colonMatch) {
                // Exclude URLs
                if (!colonMatch[1].trim().match(/^https?$/)) {
                    errors.push({
                        line: lineNumber,
                        column: colonMatch[0].length,
                        message: 'Missing space after colon.',
                        severity: 'error',
                        fixable: true,
                        code: 'MISSING_SPACE_AFTER_COLON'
                    });
                }
            }

            // 7. Check for Unclosed Quotes
            const doubleQuotes = (line.match(/"/g) || []).length;
            const singleQuotes = (line.match(/'/g) || []).length;

            if (doubleQuotes % 2 !== 0) {
                errors.push({
                    line: lineNumber,
                    column: line.length,
                    message: 'Unclosed double quote.',
                    severity: 'error',
                    fixable: true,
                    code: 'UNCLOSED_QUOTE'
                });
            } else if (singleQuotes % 2 !== 0) {
                errors.push({
                    line: lineNumber,
                    column: line.length,
                    message: 'Unclosed single quote.',
                    severity: 'error',
                    fixable: true,
                    code: 'UNCLOSED_QUOTE'
                });
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            detectedStyle: targetStyle
        };
    }

    /**
     * Fixes indentation errors in the content.
     */
    fix(content: string, options: IndentOptions = { style: 'auto' }): FixResult {
        let lines = content.split('\n');
        const targetStyle = options.style === 'auto' ? this.detectIndentationStyle(content) : parseInt(options.style);
        const changes: { line: number; type: string; original: string; fixed: string }[] = [];
        let fixedCount = 0;
        const mode = options.mode || 'all';

        // Pass 1: Comprehensive Syntax Fixes
        console.log('[SYNTAX] Starting Pass 1: Comprehensive Syntax Fixes...');

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const originalLine = line;
            let modified = false;
            const trimmed = line.trim();

            // Skip empty lines
            if (trimmed.length === 0) continue;

            // Fix Tabs (Both Modes)
            if (line.includes('\t')) {
                console.log(`[TAB FIX] Line ${i + 1}: Found tab character`);
                line = line.replace(/\t/g, ' '.repeat(targetStyle));
                modified = true;
            }

            // Fix Trailing Spaces (Syntax Mode)
            if ((mode === 'all' || mode === 'syntax') && line.match(/\s+$/)) {
                console.log(`[TRAILING] Line ${i + 1}: Removing trailing whitespace`);
                line = line.replace(/\s+$/, '');
                modified = true;
            }

            // SYNTAX MODE FIXES
            if (mode === 'all' || mode === 'syntax') {
                // 1. Fix Missing Colon After Key
                // Detect: "key" followed by newline or "key" followed by indented content
                // Pattern: Line with text but no colon, and next line is indented more
                if (!trimmed.startsWith('#') && !trimmed.includes(':') && !trimmed.startsWith('-')) {
                    // Check if this looks like a key (next line is indented or this is a known K8s key)
                    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
                    const nextIndent = nextLine.match(/^(\s*)/)?.[1].length || 0;
                    const currentIndent = line.match(/^(\s*)/)?.[1].length || 0;

                    // Common Kubernetes keys that should have colons
                    const k8sKeys = ['metadata', 'spec', 'status', 'data', 'labels', 'annotations',
                        'selector', 'template', 'containers', 'ports', 'env', 'volumes',
                        'volumeMounts', 'resources', 'limits', 'requests', 'rules', 'subjects'];

                    const isKnownKey = k8sKeys.some(key => trimmed.toLowerCase().includes(key.toLowerCase()));

                    if ((nextIndent > currentIndent && nextLine.trim().length > 0) || isKnownKey) {
                        console.log(`[MISSING COLON] Line ${i + 1}: "${trimmed}" → "${trimmed}:"`);
                        line = line.replace(trimmed, trimmed + ':');
                        modified = true;
                    }
                }

                // 2. Fix Colon Spacing: "key:value" → "key: value"
                const colonMatch = line.match(/^(\s*[^\s:]+):(?!\s)(\S.*)/);
                if (colonMatch) {
                    const keyPart = colonMatch[1];
                    const valuePart = colonMatch[2];
                    // Exclude URLs
                    if (!keyPart.trim().match(/^https?$/)) {
                        const newLine = `${keyPart}: ${valuePart}`;
                        console.log(`[COLON SPACING] Line ${i + 1}: "${line}" → "${newLine}"`);
                        line = newLine;
                        modified = true;
                    }
                }

                // 3. Fix List Item Spacing: "-item" → "- item"
                const listMatch = line.match(/^(\s*)-(?!\s)(\S.*)/);
                if (listMatch) {
                    const newLine = `${listMatch[1]}- ${listMatch[2]}`;
                    console.log(`[LIST SPACING] Line ${i + 1}: "${line}" → "${newLine}"`);
                    line = newLine;
                    modified = true;
                }

                // 4. Fix Unclosed Quotes
                // Count quotes and add closing quote if odd number
                const doubleQuotes = (line.match(/"/g) || []).length;
                const singleQuotes = (line.match(/'/g) || []).length;

                if (doubleQuotes % 2 !== 0 && !line.trim().endsWith('"')) {
                    console.log(`[UNCLOSED QUOTE] Line ${i + 1}: Adding closing double quote`);
                    line = line + '"';
                    modified = true;
                } else if (singleQuotes % 2 !== 0 && !line.trim().endsWith("'")) {
                    console.log(`[UNCLOSED QUOTE] Line ${i + 1}: Adding closing single quote`);
                    line = line + "'";
                    modified = true;
                }

                // 5. Fix Missing List Dash
                // If line is indented and looks like it should be a list item (starts with key:value at same level as previous dash)
                if (i > 0) {
                    const prevLine = lines[i - 1];
                    const prevTrimmed = prevLine.trim();
                    const currentIndentMatch = line.match(/^(\s*)/);
                    const prevIndentMatch = prevLine.match(/^(\s*)/);

                    if (prevTrimmed.startsWith('-') && currentIndentMatch && prevIndentMatch) {
                        const currentIndent = currentIndentMatch[1].length;
                        const prevIndent = prevIndentMatch[1].length;

                        // If at same indent level as previous dash line and contains a colon (key:value)
                        if (currentIndent === prevIndent && trimmed.includes(':') && !trimmed.startsWith('-')) {
                            console.log(`[MISSING DASH] Line ${i + 1}: Adding list dash`);
                            line = line.replace(/^(\s*)/, `$1- `);
                            modified = true;
                        }
                    }
                }
            }

            if (modified) {
                changes.push({ line: i + 1, type: 'syntax', original: originalLine, fixed: line });
                lines[i] = line;
                fixedCount++;
            }
        }

        console.log(`[SYNTAX] Pass 1 complete. Fixed ${fixedCount} syntax issues.`);

        // Pass 2: Structural Re-indentation (Indentation Mode)
        // Simplified approach: snap each line to the nearest valid indent level
        if (mode === 'all' || mode === 'indentation') {
            console.log('[INDENT] Starting Pass 2...');

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                const trimmed = line.trim();

                // Skip empty lines and comments
                if (trimmed.length === 0 || trimmed.startsWith('#')) {
                    console.log(`[INDENT] Line ${i + 1}: Skipping (empty or comment)`);
                    continue;
                }

                // Get current indentation
                const match = line.match(/^(\s*)(.*)/);
                if (!match) continue;

                const currentIndent = match[1].length;
                const content = match[2];

                console.log(`[INDENT] Line ${i + 1}: Current indent=${currentIndent}, Content="${content.substring(0, 30)}..."`);

                // Calculate the nearest valid indentation (multiple of targetStyle)
                // Round to nearest, but if it's at 0, keep it at 0
                let newIndent: number;
                if (currentIndent === 0) {
                    newIndent = 0;
                } else {
                    // Round to nearest multiple of targetStyle
                    const levels = currentIndent / targetStyle;
                    newIndent = Math.round(levels) * targetStyle;

                    // Ensure minimum indent of targetStyle if line was indented
                    if (newIndent === 0 && currentIndent > 0) {
                        newIndent = targetStyle;
                    }
                }

                console.log(`[INDENT] Line ${i + 1}: New indent=${newIndent}`);

                // Apply fix if different
                if (newIndent !== currentIndent) {
                    const originalLine = line;
                    line = ' '.repeat(newIndent) + content;
                    lines[i] = line;
                    changes.push({ line: i + 1, type: 'indent', original: originalLine, fixed: line });
                    fixedCount++;
                    console.log(`[INDENT FIX] Line ${i + 1}: "${originalLine}" -> "${line}"`);
                } else {
                    console.log(`[INDENT] Line ${i + 1}: No change needed`);
                }
            }

            console.log(`[INDENT] Pass 2 complete. Fixed ${fixedCount} lines.`);
        }

        return {
            content: lines.join('\n'),
            fixedCount,
            changes
        };
    }

    /**
     * NUCLEAR OPTION: Aggressive fixing that ALWAYS works
     * Skips parsing, just fixes everything line by line
     */
    fixWithParser(content: string, options: IndentOptions = { style: 'auto' }): FixResult {
        const targetStyle = options.style === 'auto' ? this.detectIndentationStyle(content) : parseInt(options.style);

        console.log('[NUCLEAR] Starting aggressive fix...');
        console.log('[NUCLEAR] Target style:', targetStyle);

        // ALWAYS use aggressive fixing - don't try to parse
        return this.aggressiveFix(content, targetStyle);
    }

    /**
     * Aggressive line-by-line fixing for YAML content.
     * This method applies a series of fixes without attempting to parse the full YAML structure,
     * making it robust for highly malformed input.
     */
    private aggressiveFix(content: string, targetStyle: number): FixResult {
        let lines = content.split('\n');
        const changes: { line: number; type: string; original: string; fixed: string }[] = [];
        let fixedCount = 0;

        console.log('[AGGRESSIVE] Processing', lines.length, 'lines');

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const original = line;
            let wasModified = false;

            // Debug: Log lines 1-15 to see structure
            if (i < 15) {
                console.log(`[DEBUG] Line ${i + 1}: "${line}" (indent: ${line.match(/^(\s*)/)?.[1].length || 0})`);
            }

            // 1. Remove ALL trailing whitespace
            if (line.match(/\s+$/)) {
                line = line.replace(/\s+$/, '');
                wasModified = true;
                console.log(`[AGGRESSIVE] Line ${i + 1}: Removed trailing whitespace`);
            }

            // 2. Convert tabs to spaces
            if (line.includes('\t')) {
                line = line.replace(/\t/g, ' '.repeat(targetStyle));
                wasModified = true;
                console.log(`[AGGRESSIVE] Line ${i + 1}: Converted tabs`);
            }

            // 3. Fix indentation - snap to grid with smart capping
            const match = line.match(/^(\s*)(.*)/);
            if (match && match[2].trim().length > 0) {
                const currentIndent = match[1].length;
                const content = match[2];

                // Find previous non-empty, non-comment line
                let prevIndent = 0;
                for (let j = i - 1; j >= 0; j--) {
                    const prevLine = lines[j];
                    if (prevLine.trim().length > 0 && !prevLine.trim().startsWith('#')) {
                        const prevMatch = prevLine.match(/^(\s*)/);
                        prevIndent = prevMatch ? prevMatch[1].length : 0;
                        break;
                    }
                }

                // Snap to nearest valid multiple of targetStyle
                let newIndent = Math.round(currentIndent / targetStyle) * targetStyle;

                // Special case: if rounding gives 0 but we had some indent, use targetStyle
                if (newIndent === 0 && currentIndent > 0) {
                    newIndent = targetStyle;
                }

                // Smart cap: don't indent more than one level deeper than previous line
                // This prevents 3 spaces from becoming 4 when previous line is at 2
                const maxAllowedIndent = prevIndent + targetStyle;
                if (newIndent > maxAllowedIndent && currentIndent <= maxAllowedIndent) {
                    // If original was close to previous level, snap down instead of up
                    newIndent = Math.floor(currentIndent / targetStyle) * targetStyle;
                    if (newIndent === 0 && currentIndent > 0) {
                        newIndent = targetStyle;
                    }
                }

                // Log the decision
                if (i < 15) {
                    console.log(`[INDENT CALC] Line ${i + 1}: ${currentIndent} → ${newIndent} (prev: ${prevIndent}, max: ${maxAllowedIndent})`);
                }

                if (newIndent !== currentIndent) {
                    line = ' '.repeat(newIndent) + content;
                    wasModified = true;
                    console.log(`[AGGRESSIVE] Line ${i + 1}: Fixed indent ${currentIndent} → ${newIndent}`);
                }
            }

            // 4. Fix colon spacing: "key:value" → "key: value"
            const colonMatch = line.match(/^(\s*[^\s:]+):(?!\s)(\S.*)/);
            if (colonMatch && !colonMatch[1].trim().match(/^https?$/)) {
                line = line.replace(/^(\s*[^\s:]+):(?!\s)(\S.*)/, '$1: $2');
                wasModified = true;
                console.log(`[AGGRESSIVE] Line ${i + 1}: Fixed colon spacing`);
            }

            // 5. Fix list spacing: "-item" → "- item"
            const listMatch = line.match(/^(\s*)-(?!\s)(\S.*)/);
            if (listMatch) {
                line = line.replace(/^(\s*)-(?!\s)(\S.*)/, '$1- $2');
                wasModified = true;
                console.log(`[AGGRESSIVE] Line ${i + 1}: Fixed list spacing`);
            }

            // 6. Add missing colons to known keys (including YAML anchors)
            const trimmed = line.trim();
            const k8sKeys = ['metadata', 'spec', 'status', 'data', 'labels', 'annotations',
                'selector', 'template', 'containers', 'ports', 'env', 'volumes',
                'volumeMounts', 'resources', 'limits', 'requests', 'meta'];

            // Check for YAML anchor pattern: "key &anchor" or just "key"
            const anchorMatch = trimmed.match(/^([a-zA-Z0-9_-]+)(\s+&\w+)?$/);

            if (!trimmed.includes(':') && !trimmed.startsWith('-') && !trimmed.startsWith('#') && trimmed.length > 0) {
                let shouldAddColon = false;

                // Check if it's a known K8s key
                const baseKey = anchorMatch ? anchorMatch[1] : trimmed;
                const isKnownKey = k8sKeys.some(key => baseKey.toLowerCase() === key.toLowerCase());

                // Check if it has an anchor (YAML anchor syntax)
                const hasAnchor = anchorMatch && anchorMatch[2];

                if (isKnownKey || hasAnchor) {
                    shouldAddColon = true;
                }

                if (shouldAddColon) {
                    line = line.replace(trimmed, trimmed + ':');
                    wasModified = true;
                    console.log(`[AGGRESSIVE] Line ${i + 1}: Added colon to "${trimmed}"`);
                }
            }

            // 7. Fix unclosed quotes
            const doubleQuotes = (line.match(/"/g) || []).length;
            const singleQuotes = (line.match(/'/g) || []).length;

            if (doubleQuotes % 2 !== 0 && !line.trim().endsWith('"')) {
                line = line + '"';
                wasModified = true;
                console.log(`[AGGRESSIVE] Line ${i + 1}: Closed double quote`);
            } else if (singleQuotes % 2 !== 0 && !line.trim().endsWith("'")) {
                line = line + "'";
                wasModified = true;
                console.log(`[AGGRESSIVE] Line ${i + 1}: Closed single quote`);
            }

            if (wasModified) {
                changes.push({ line: i + 1, type: 'aggressive', original, fixed: line });
                fixedCount++;
            }

            lines[i] = line;
        }

        console.log(`[AGGRESSIVE] Complete. Fixed ${fixedCount} lines.`);

        return {
            content: lines.join('\n'),
            fixedCount,
            changes
        };
    }
}
