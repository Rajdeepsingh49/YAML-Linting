/**
 * Industry-Grade YAML Fixer for Kubernetes Configurations
 * 
 * Three-Phase Architecture:
 * 1. Line-by-Line Syntax Normalization (always runs, even on broken YAML)
 * 2. YAML Parsing & Validation (only after Phase 1)
 * 3. Semantic & Structural Fixes (only if parsing succeeds)
 * 
 * This design ensures broken YAML can be progressively repaired without crashing.
 */

import * as yaml from 'js-yaml';
import type {
    ValidationOptions,
    ValidationResult,
    FixResult,
    StructuralFixResult,
    ValidationError,
    StructuralIssue,
    FixChange
} from '../types/yaml-validator.types.js';

// ==========================================
// CONSTANTS & KNOWLEDGE BASE
// ==========================================

/**
 * Common typos and their correct forms
 */
const KEY_ALIASES: Record<string, string> = {
    'met': 'metadata',
    'meta': 'metadata',
    'metdata': 'metadata',
    'metadata_': 'metadata',
    'metadta': 'metadata',
    'specf': 'spec',
    'spec_': 'spec',
    'sepc': 'spec',
    'spc': 'spec',
    'contianers': 'containers',
    'containers_': 'containers',
    'conteiners': 'containers',
    'containres': 'containers',
    'volumns': 'volumes',
    'volums': 'volumes',
    'volumes_': 'volumes',
    'volumnes': 'volumes',
    'envs': 'env',
    'env_': 'env',
    'enviroment': 'env',
    'environment': 'env',
    'labels_': 'labels',
    'lables': 'labels',
    'labes': 'labels',
    'annotations_': 'annotations',
    'annotaions': 'annotations',
    'image_': 'image',
    'img': 'image',
    'ports_': 'ports',
    'port_': 'ports',
    'selector_': 'selector',
    'selecter': 'selector',
    'replicas_': 'replicas',
    'replica': 'replicas',
    'namespace_': 'namespace',
    'namespce': 'namespace',
    'namesapce': 'namespace',
    'dat': 'data',
    'securitycontext': 'securityContext',
    'fsgroup': 'fsGroup',
    'runasuser': 'runAsUser',
    'accessmodes': 'accessModes'
};

/**
 * Known Kubernetes keys that should have colons
 */
const KNOWN_K8S_KEYS = new Set([
    'apiVersion', 'kind', 'metadata', 'spec', 'status',
    'name', 'namespace', 'labels', 'annotations',
    'replicas', 'selector', 'template', 'strategy',
    'containers', 'initContainers', 'volumes', 'volumeMounts',
    'image', 'imagePullPolicy', 'command', 'args', 'env', 'envFrom',
    'ports', 'containerPort', 'hostPort', 'protocol',
    'resources', 'limits', 'requests', 'cpu', 'memory',
    'restartPolicy', 'nodeSelector', 'affinity', 'tolerations',
    'serviceAccountName', 'securityContext', 'hostNetwork',
    'type', 'clusterIP', 'externalIPs', 'loadBalancerIP',
    'port', 'targetPort', 'nodePort',
    'path', 'pathType', 'backend', 'serviceName', 'servicePort',
    'data', 'stringData', 'binaryData',
    'rules', 'verbs', 'apiGroups', 'resources',
    'effect', 'key', 'operator', 'value', 'tolerationSeconds',
    'persistentVolumeClaim', 'accessModes', 'fsGroup', 'runAsUser', 'matchLabels', 'claimName', 'storage', 'disktype'
]);

/**
 * Fields that should contain numeric values
 */
const NUMERIC_FIELDS = new Set([
    'replicas', 'containerPort', 'port', 'targetPort', 'nodePort',
    'hostPort', 'timeoutSeconds', 'periodSeconds', 'successThreshold',
    'failureThreshold', 'initialDelaySeconds', 'terminationGracePeriodSeconds',
    'activeDeadlineSeconds', 'progressDeadlineSeconds', 'revisionHistoryLimit',
    'minReadySeconds', 'weight', 'priority'
]);

/**
 * Fields that should be under metadata
 */
const METADATA_FIELDS = new Set(['name', 'namespace', 'labels', 'annotations', 'generateName']);

/**
 * Fields that should be under spec (for Deployments)
 */
const SPEC_FIELDS = new Set(['replicas', 'selector', 'template', 'strategy', 'minReadySeconds', 'progressDeadlineSeconds', 'revisionHistoryLimit']);

/**
 * Fields that should be under spec.template.spec (for pod specs)
 */
const POD_SPEC_FIELDS = new Set(['containers', 'initContainers', 'volumes', 'restartPolicy', 'nodeSelector', 'affinity', 'tolerations', 'serviceAccountName', 'securityContext', 'hostNetwork', 'dnsPolicy', 'imagePullSecrets']);

// ==========================================
// MAIN YAML FIXER CLASS
// ==========================================

export class YAMLFixer {
    private indentSize: number = 2;

    constructor(indentSize: number = 2) {
        this.indentSize = indentSize;
    }

    /**
     * PHASE 1: Line-by-Line Syntax Normalization
     * This phase ALWAYS runs, even on completely broken YAML
     */
    private phase1_syntaxNormalization(content: string): { lines: string[], changes: FixChange[] } {
        const lines = content.split('\n');
        const normalizedLines: string[] = [];
        const changes: FixChange[] = [];
        let inBlockScalar = false;
        let inConfigMapData = false;
        let configMapIndent = 0;

        // Duplicate key detection state
        const seenKeys = new Map<number, Set<string>>(); // indent level -> set of keys
        let lastIndent = 0;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const original = line;
            const trimmed = line.trim();

            // Handle block scalars (skip processing inside them)
            if (trimmed.endsWith('|') || trimmed.endsWith('>')) {
                inBlockScalar = true;
            } else if (inBlockScalar && trimmed && !line.startsWith(' ')) {
                inBlockScalar = false;
            }

            if (inBlockScalar && i > 0) { // Skip first line of block scalar
                normalizedLines.push(line);
                continue;
            }

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) {
                normalizedLines.push(line);
                continue;
            }

            // 1. Convert tabs to spaces
            if (line.includes('\t')) {
                line = line.replace(/\t/g, ' '.repeat(this.indentSize));
                changes.push({
                    type: 'INDENT',
                    line: i + 1,
                    original,
                    fixed: line,
                    reason: 'Converted tabs to spaces',
                    severity: 'warning'
                });
            }

            // 2. Remove trailing whitespace
            const trimmedRight = line.trimRight();
            if (trimmedRight !== line) {
                line = trimmedRight;
            }

            // FIX 6: ConfigMap Data Nesting
            if (trimmed === 'data:' && (lines[i - 1]?.includes('ConfigMap') || lines[i - 2]?.includes('ConfigMap'))) {
                inConfigMapData = true;
                configMapIndent = line.search(/\S/);
            } else if (inConfigMapData) {
                if (trimmed.startsWith('---') || (line.search(/\S/) <= configMapIndent && trimmed !== '')) {
                    inConfigMapData = false;
                } else {
                    // Check if line needs indentation
                    const currentIndent = line.search(/\S/);
                    if (currentIndent <= configMapIndent) {
                        const newIndent = configMapIndent + this.indentSize;
                        line = ' '.repeat(newIndent) + trimmed;
                        changes.push({
                            type: 'INDENT',
                            line: i + 1,
                            original,
                            fixed: line,
                            reason: 'Fixed ConfigMap data nesting',
                            severity: 'error'
                        });
                    }
                }
            }

            // FIX 4: Under-indentation
            // Check if previous line was a list item "- name: something" and current line is under-indented
            if (normalizedLines.length > 0) {
                const prevLine = normalizedLines[normalizedLines.length - 1];
                const prevTrimmed = prevLine.trim();
                if (prevTrimmed.startsWith('- ') && prevTrimmed.includes(':')) {
                    const prevDashPos = prevLine.indexOf('-');
                    const currentIndent = line.search(/\S/);
                    const expectedIndent = prevDashPos + 2; // Align with content of list item

                    // If current line is a property (has colon) and under-indented
                    if (trimmed.includes(':') && currentIndent < expectedIndent && currentIndent > prevDashPos) {
                        line = ' '.repeat(expectedIndent) + trimmed;
                        changes.push({
                            type: 'INDENT',
                            line: i + 1,
                            original,
                            fixed: line,
                            reason: 'Fixed under-indentation relative to list item',
                            severity: 'error'
                        });
                    }
                }
            }

            let currentTrimmed = line.trim();

            // FIX 1: Missing Colon Detection (General "key value" pattern)
            // Regex: /^(\s*)([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_\/:.@=+-]+)$/
            // Removed check for !currentTrimmed.includes(':') to handle values like "image:tag"
            const keyValueMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_\/:.@=+-]+)$/);
            if (keyValueMatch && !currentTrimmed.startsWith('-')) {
                const [, indent, key, value] = keyValueMatch;
                // Only apply if the line doesn't already look like a valid key-value pair "key: value"
                if (!line.match(/^\s*[a-zA-Z0-9_-]+:\s/)) {
                    line = `${indent}${key}: ${value}`;
                    changes.push({
                        type: 'COLON',
                        line: i + 1,
                        original,
                        fixed: line,
                        reason: `Added missing colon to "${key}"`,
                        severity: 'critical'
                    });
                    currentTrimmed = line.trim();
                }
            }

            // FIX 3: Orphaned List Items
            // Pattern: "- DATABASE_HOST" followed by "value: localhost"
            const orphanedMatch = line.match(/^(\s*)-\s+([A-Z0-9_]+)$/);
            if (orphanedMatch && i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine.startsWith('value:')) {
                    const [, indent, key] = orphanedMatch;
                    line = `${indent}- name: ${key}`;
                    changes.push({
                        type: 'STRUCTURE',
                        line: i + 1,
                        original,
                        fixed: line,
                        reason: `Fixed orphaned list item "${key}"`,
                        severity: 'error'
                    });
                    currentTrimmed = line.trim();
                }
            }

            // FIX 7: VolumeClaimTemplates and List Context Colons
            // Pattern: "- metadata" -> "- metadata:"
            if (currentTrimmed.startsWith('- ') && !currentTrimmed.includes(':')) {
                const listKeyMatch = currentTrimmed.match(/^-\s+([a-zA-Z0-9_-]+)$/);
                if (listKeyMatch) {
                    const key = listKeyMatch[1];
                    if (['metadata', 'spec', 'accessModes', 'volumeMounts', 'resources', 'requests', 'limits'].includes(key)) {
                        const indent = line.match(/^(\s*)/)?.[1] || '';
                        line = `${indent}- ${key}:`;
                        changes.push({
                            type: 'COLON',
                            line: i + 1,
                            original,
                            fixed: line,
                            reason: `Added missing colon to list item "${key}"`,
                            severity: 'critical'
                        });
                        currentTrimmed = line.trim();
                    }
                }
            }

            // 3. Fix missing colons for known K8s keys (Legacy/Specific check)
            // Updated check to handle values with colons
            if (!currentTrimmed.match(/^[a-zA-Z0-9_-]+:/) && !currentTrimmed.startsWith('-') && !currentTrimmed.startsWith('#')) {
                const parts = currentTrimmed.split(/\s+/);
                if (parts.length >= 1) {
                    const potentialKey = parts[0];
                    const correctKey = KEY_ALIASES[potentialKey.toLowerCase()] || KEY_ALIASES[potentialKey] || potentialKey;

                    if (KNOWN_K8S_KEYS.has(correctKey) || KNOWN_K8S_KEYS.has(potentialKey)) {
                        const indent = line.match(/^(\s*)/)?.[1] || '';
                        if (parts.length === 1) {
                            // Single word: "spec" -> "spec:"
                            line = `${indent}${correctKey}:`;
                            changes.push({
                                type: 'COLON',
                                line: i + 1,
                                original,
                                fixed: line,
                                reason: `Added missing colon to "${correctKey}"`,
                                severity: 'critical'
                            });
                        } else {
                            // Multiple words: "name app" -> "name: app"
                            // Only apply if not already caught by Fix 1
                            if (!keyValueMatch) {
                                const rest = parts.slice(1).join(' ');
                                line = `${indent}${correctKey}: ${rest}`;
                                changes.push({
                                    type: 'COLON',
                                    line: i + 1,
                                    original,
                                    fixed: line,
                                    reason: `Added missing colon to "${correctKey}"`,
                                    severity: 'critical'
                                });
                            }
                        }
                    }
                }
            }

            const updatedTrimmed = line.trim();

            // 4. Fix missing space after colon
            // Pattern: "protocol:TCP" -> "protocol: TCP"
            // Avoid URLs like "http://"
            if (updatedTrimmed.includes(':') && !updatedTrimmed.includes('://')) {
                const colonSpaceFix = line.replace(/^(\s*)([^:\s]+):(?!\s)([^#\s].*)/, '$1$2: $3');
                if (colonSpaceFix !== line) {
                    changes.push({
                        type: 'COLON',
                        line: i + 1,
                        original: line,
                        fixed: colonSpaceFix,
                        reason: 'Added space after colon',
                        severity: 'info'
                    });
                    line = colonSpaceFix;
                }
            }

            // 5. Fix list item spacing
            // Pattern: "-item" -> "- item"
            // Pattern: "-effect: NoSchedule" -> "- effect: NoSchedule"
            // Skip document separators (---)
            if (updatedTrimmed.startsWith('-') && updatedTrimmed.length > 1 && updatedTrimmed[1] !== ' ' && updatedTrimmed[1] !== '-') {
                const indent = line.match(/^(\s*)/)?.[1] || '';
                const content = updatedTrimmed.substring(1);
                line = `${indent}- ${content}`;
                changes.push({
                    type: 'LIST',
                    line: i + 1,
                    original,
                    fixed: line,
                    reason: 'Added space after list marker',
                    severity: 'info'
                });
            }

            // 6. Fix list items with missing colons
            // Pattern: "- name nginx" -> "- name: nginx"
            const listItemMatch = line.match(/^(\s*)-\s+([a-zA-Z0-9_-]+)\s+(.+)$/);
            if (listItemMatch && !listItemMatch[0].includes(':')) {
                const [, indent, key, value] = listItemMatch;
                const correctKey = KEY_ALIASES[key.toLowerCase()] || KEY_ALIASES[key] || key;
                if (KNOWN_K8S_KEYS.has(correctKey) || KNOWN_K8S_KEYS.has(key)) {
                    line = `${indent}- ${correctKey}: ${value}`;
                    changes.push({
                        type: 'COLON',
                        line: i + 1,
                        original,
                        fixed: line,
                        reason: `Added missing colon in list item "${correctKey}"`,
                        severity: 'critical'
                    });
                }
            }

            // 7. Fix common key typos
            const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+):/);
            if (keyMatch) {
                const [, indent, key] = keyMatch;
                const lowerKey = key.toLowerCase();
                const correctKey = KEY_ALIASES[lowerKey] || KEY_ALIASES[key];
                if (correctKey && correctKey !== key) {
                    line = line.replace(`${indent}${key}:`, `${indent}${correctKey}:`);
                    changes.push({
                        type: 'KEY_FIX',
                        line: i + 1,
                        original,
                        fixed: line,
                        reason: `Fixed typo "${key}" -> "${correctKey}"`,
                        severity: 'warning'
                    });
                }
            }

            // 8. Close unclosed quotes
            const doubleQuotes = (line.match(/"/g) || []).length;
            const singleQuotes = (line.match(/'/g) || []).length;
            if (doubleQuotes % 2 !== 0) {
                line += '"';
                changes.push({
                    type: 'QUOTE',
                    line: i + 1,
                    original,
                    fixed: line,
                    reason: 'Closed unclosed double quote',
                    severity: 'critical'
                });
            }
            if (singleQuotes % 2 !== 0) {
                line += "'";
                changes.push({
                    type: 'QUOTE',
                    line: i + 1,
                    original,
                    fixed: line,
                    reason: 'Closed unclosed single quote',
                    severity: 'critical'
                });
            }

            // FIX 5: Duplicate Key Removal (Moved to Phase 1)
            // Logic: Track keys per indent level. Reset on dedent or list item start.
            const currentIndent = line.search(/\S/);
            if (currentIndent !== -1) { // Skip empty lines
                // Reset deeper levels if we dedented
                if (currentIndent < lastIndent) {
                    const deeperLevels = Array.from(seenKeys.keys()).filter(l => l > currentIndent);
                    deeperLevels.forEach(l => seenKeys.delete(l));
                }

                // Reset current level (and deeper) if we start a new list item
                if (updatedTrimmed.startsWith('- ')) {
                    const levelsToClear = Array.from(seenKeys.keys()).filter(l => l >= currentIndent);
                    levelsToClear.forEach(l => seenKeys.delete(l));
                }

                // Reset ALL keys if we see a document separator
                if (line.startsWith('---')) {
                    seenKeys.clear();
                    lastIndent = 0;
                    normalizedLines.push(line);
                    continue;
                }

                // Extract key
                // Match "key:" or "- key:"
                const keyExtract = line.match(/^[ -]*([a-zA-Z0-9_-]+):/);
                if (keyExtract) {
                    const key = keyExtract[1];
                    const keyStart = line.indexOf(key);

                    if (!seenKeys.has(keyStart)) {
                        seenKeys.set(keyStart, new Set());
                    }

                    const keysAtLevel = seenKeys.get(keyStart)!;
                    if (keysAtLevel.has(key)) {
                        // DUPLICATE! Remove the line.
                        changes.push({
                            type: 'DUPLICATE',
                            line: i + 1,
                            original,
                            fixed: '', // Empty string to remove
                            reason: `Removed duplicate key "${key}"`,
                            severity: 'error'
                        });
                        // Don't add to normalizedLines
                        continue;
                    } else {
                        keysAtLevel.add(key);
                    }
                }

                lastIndent = currentIndent;
            }

            normalizedLines.push(line);
        }

        return { lines: normalizedLines, changes };
    }

    /**
     * PHASE 2: YAML Parsing & Validation
     * Only runs after Phase 1 completes
     */
    private phase2_parseValidation(content: string): { valid: boolean, errors: ValidationError[], parsed?: any } {
        const errors: ValidationError[] = [];

        try {
            // Handle both single and multi-document YAML
            const documents = yaml.loadAll(content);
            const parsed = documents.length === 1 ? documents[0] : documents;
            return { valid: true, errors: [], parsed };
        } catch (e: any) {
            errors.push({
                line: e.mark ? e.mark.line + 1 : 0,
                column: e.mark ? e.mark.column + 1 : 0,
                message: e.message,
                severity: 'critical',
                code: 'YAML_PARSE_ERROR',
                fixable: false
            });
            return { valid: false, errors };
        }
    }

    /**
     * PHASE 3: Semantic & Structural Fixes
     * Only runs if Phase 2 parsing succeeds
     */
    private phase3_semanticFixes(lines: string[], _parsed: any, _aggressive: boolean): { lines: string[], changes: FixChange[] } {
        const fixedLines: string[] = [];
        const changes: FixChange[] = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const original = line;
            const trimmed = line.trim();
            const indent = line.match(/^(\s*)/)?.[1].length || 0;

            if (!trimmed || trimmed.startsWith('#')) {
                fixedLines.push(line);
                continue;
            }

            // 1. Convert string numbers to integers for numeric fields (FIX 2)
            const keyMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
            if (keyMatch) {
                const [, key, value] = keyMatch;

                if (NUMERIC_FIELDS.has(key)) {
                    const cleanValue = value.replace(/['"]/g, '').trim();
                    const lowerValue = cleanValue.toLowerCase();

                    // Word to number map
                    const WORD_TO_NUM: Record<string, number> = {
                        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
                    };

                    // Handle numeric strings
                    if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
                        if (value.includes('"') || value.includes("'")) {
                            line = `${' '.repeat(indent)}${key}: ${cleanValue}`;
                            changes.push({
                                type: 'NUMERIC',
                                line: i + 1,
                                original,
                                fixed: line,
                                reason: `Converted string "${value}" to number`,
                                severity: 'info'
                            });
                        }
                    }
                    // Handle word numbers (e.g., "three" -> 3)
                    else if (WORD_TO_NUM[lowerValue] !== undefined) {
                        line = `${' '.repeat(indent)}${key}: ${WORD_TO_NUM[lowerValue]}`;
                        changes.push({
                            type: 'NUMERIC',
                            line: i + 1,
                            original,
                            fixed: line,
                            reason: `Converted word "${value}" to number`,
                            severity: 'warning'
                        });
                    }
                }
            }

            fixedLines.push(line);
        }

        return { lines: fixedLines, changes };
    }

    /**
     * PHASE 3B: Structural Reorganization (Aggressive Mode)
     * Moves misplaced fields to their correct locations
     */
    private phase3b_structuralFixes(parsed: any): { content: string, explanation: string } {
        let explanation = '';

        // Handle multi-document YAML
        if (Array.isArray(parsed)) {
            const fixedDocs = parsed.map(doc => {
                const result = this.fixSingleDocument(doc);
                if (result.explanation) {
                    explanation += result.explanation + ' ';
                }
                return result.doc;
            });

            const dumped = fixedDocs.map(doc =>
                yaml.dump(doc, { indent: this.indentSize, lineWidth: -1, noRefs: true, sortKeys: false })
            ).join('---\n');

            return { content: dumped, explanation: explanation.trim() || 'No structural changes needed' };
        }

        // Single document
        const result = this.fixSingleDocument(parsed);
        const dumped = yaml.dump(result.doc, {
            indent: this.indentSize,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });

        return { content: dumped, explanation: result.explanation || 'No structural changes needed' };
    }

    /**
     * Fix a single YAML document's structure
     */
    private fixSingleDocument(parsed: any): { doc: any, explanation: string } {
        let explanation = '';

        if (!parsed || typeof parsed !== 'object') {
            return { doc: parsed, explanation: '' };
        }

        // 1. Move metadata fields from root to metadata
        METADATA_FIELDS.forEach(field => {
            if (parsed[field] !== undefined) {
                if (!parsed.metadata) parsed.metadata = {};
                parsed.metadata[field] = parsed[field];
                delete parsed[field];
                explanation += `Moved "${field}" to "metadata.${field}". `;
            }
        });

        // 2. Move spec fields from root to spec (for Deployments)
        if (parsed.kind === 'Deployment' || parsed.kind === 'StatefulSet' || parsed.kind === 'DaemonSet') {
            SPEC_FIELDS.forEach(field => {
                if (parsed[field] !== undefined) {
                    if (!parsed.spec) parsed.spec = {};
                    parsed.spec[field] = parsed[field];
                    delete parsed[field];
                    explanation += `Moved "${field}" to "spec.${field}". `;
                }
            });

            // 3. Ensure spec.template.metadata and spec.template.spec exist
            if (parsed.spec && !parsed.spec.template) {
                parsed.spec.template = { metadata: {}, spec: {} };
                explanation += 'Created "spec.template.metadata" and "spec.template.spec" structure. ';
            } else if (parsed.spec && parsed.spec.template) {
                if (!parsed.spec.template.metadata) {
                    parsed.spec.template.metadata = {};
                    explanation += 'Created "spec.template.metadata". ';
                }
                if (!parsed.spec.template.spec) {
                    parsed.spec.template.spec = {};
                    explanation += 'Created "spec.template.spec". ';
                }
            }

            // 4. Move pod spec fields from root or spec to spec.template.spec
            POD_SPEC_FIELDS.forEach(field => {
                if (parsed[field] !== undefined) {
                    if (!parsed.spec) parsed.spec = {};
                    if (!parsed.spec.template) parsed.spec.template = { metadata: {}, spec: {} };
                    if (!parsed.spec.template.spec) parsed.spec.template.spec = {};
                    parsed.spec.template.spec[field] = parsed[field];
                    delete parsed[field];
                    explanation += `Moved "${field}" from root to "spec.template.spec.${field}". `;
                } else if (parsed.spec && parsed.spec[field] !== undefined && field !== 'selector') {
                    if (!parsed.spec.template) parsed.spec.template = { metadata: {}, spec: {} };
                    if (!parsed.spec.template.spec) parsed.spec.template.spec = {};
                    parsed.spec.template.spec[field] = parsed.spec[field];
                    delete parsed.spec[field];
                    explanation += `Moved "${field}" from "spec" to "spec.template.spec.${field}". `;
                }
            });
        }

        // 5. For Services, move type and ports to spec if at root
        if (parsed.kind === 'Service') {
            if (parsed.type !== undefined) {
                if (!parsed.spec) parsed.spec = {};
                parsed.spec.type = parsed.type;
                delete parsed.type;
                explanation += 'Moved "type" to "spec.type". ';
            }
            if (parsed.ports !== undefined) {
                if (!parsed.spec) parsed.spec = {};
                parsed.spec.ports = parsed.ports;
                delete parsed.ports;
                explanation += 'Moved "ports" to "spec.ports". ';
            }
        }

        return { doc: parsed, explanation: explanation.trim() };
    }

    /**
     * Main Fix Method - Orchestrates all three phases
     */
    public fix(content: string, options: ValidationOptions = {}): FixResult {
        const aggressive = options.aggressive || false;
        const allChanges: FixChange[] = [];

        console.log('[YAML FIXER] Starting three-phase fix pipeline...');

        // PHASE 1: Syntax Normalization (always runs)
        console.log('[PHASE 1] Line-by-line syntax normalization...');
        const phase1Result = this.phase1_syntaxNormalization(content);
        allChanges.push(...phase1Result.changes);
        let fixedContent = phase1Result.lines.join('\n');

        console.log(`[PHASE 1] Complete. Fixed ${phase1Result.changes.length} syntax issues.`);

        // PHASE 2: Parse Validation
        console.log('[PHASE 2] YAML parsing and validation...');
        const phase2Result = this.phase2_parseValidation(fixedContent);

        if (!phase2Result.valid) {
            console.log('[PHASE 2] Parsing failed. Returning Phase 1 results only.');
            return {
                content: fixedContent,
                fixedCount: allChanges.length,
                changes: allChanges,
                errors: phase2Result.errors
            };
        }

        console.log('[PHASE 2] Parsing successful.');

        // PHASE 3: Semantic Fixes
        console.log('[PHASE 3] Semantic and structural fixes...');
        const phase3Result = this.phase3_semanticFixes(phase1Result.lines, phase2Result.parsed, aggressive);
        allChanges.push(...phase3Result.changes);
        fixedContent = phase3Result.lines.join('\n');

        console.log(`[PHASE 3] Complete. Applied ${phase3Result.changes.length} semantic fixes.`);

        // PHASE 3B: Structural Reorganization (only in aggressive mode)
        if (aggressive) {
            console.log('[PHASE 3B] Aggressive structural reorganization...');
            const structuralResult = this.phase3b_structuralFixes(phase2Result.parsed);
            fixedContent = structuralResult.content;
            if (structuralResult.explanation && structuralResult.explanation !== 'No structural changes needed') {
                allChanges.push({
                    type: 'STRUCTURE',
                    line: 0,
                    original: '',
                    fixed: '',
                    reason: structuralResult.explanation,
                    severity: 'warning'
                });
            }
            console.log(`[PHASE 3B] Complete. ${structuralResult.explanation}`);
        }

        console.log(`[YAML FIXER] Pipeline complete. Total fixes: ${allChanges.length}`);

        return {
            content: fixedContent,
            fixedCount: allChanges.length,
            changes: allChanges,
            errors: []
        };
    }

    /**
     * Validate Method - Reports issues without fixing
     */
    public validate(content: string, _options: ValidationOptions = {}): ValidationResult {
        const errors: ValidationError[] = [];
        const structuralIssues: StructuralIssue[] = [];

        // Run Phase 1 to detect syntax issues
        const phase1Result = this.phase1_syntaxNormalization(content);
        phase1Result.changes.forEach(change => {
            errors.push({
                line: change.line,
                message: change.reason,
                severity: change.severity,
                code: change.type,
                fixable: true
            });
        });

        // Run Phase 2 to detect parsing issues
        const phase2Result = this.phase2_parseValidation(content);
        errors.push(...phase2Result.errors);

        return {
            valid: errors.length === 0 && structuralIssues.length === 0,
            errors,
            structuralIssues
        };
    }

    /**
     * Legacy method for structural fixes (kept for compatibility)
     */
    public fixStructural(content: string, _k8sKind: string = 'Deployment'): StructuralFixResult {
        try {
            const parsed = yaml.load(content) as any;
            if (!parsed) {
                return { content, restructuredLines: [], explanation: 'Empty document' };
            }

            const result = this.phase3b_structuralFixes(parsed);
            return {
                content: result.content,
                restructuredLines: [],
                explanation: result.explanation
            };
        } catch (e) {
            return {
                content,
                restructuredLines: [],
                explanation: 'Failed to restructure: ' + (e as Error).message
            };
        }
    }
}
