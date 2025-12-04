/**
 * Type definitions for the Semantic YAML Validator
 */

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
export type LineSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Represents a line in the YAML document with semantic information
 */
export interface SemanticLine {
    lineNumber: number;
    content: string;
    indent: number;
    type: LineType;
    key?: string;
    value?: string;
    isListItem: boolean;
    hasColon: boolean;
    parent?: SemanticLine;
    children: SemanticLine[];
    confidence?: number;
}

export type LineType =
    | 'key-value'      // key: value
    | 'key-only'       // key (missing value/colon)
    | 'value-only'     // orphaned value
    | 'list-item'      // - item
    | 'comment'        // # comment
    | 'blank'          // empty line
    | 'separator'      // ---
    | 'block-scalar'   // | or >
    | 'unknown';

/**
 * Kubernetes field schema definition
 */
export interface FieldSchema {
    name: string;
    type: FieldType;
    required: boolean;
    parent: string;          // Path where this field must live (e.g., "spec.template.spec")
    aliases?: string[];      // Common typos/variations
    children?: FieldSchema[];
    description?: string;
}

/**
 * Kubernetes resource schema
 */
export interface ResourceSchema {
    kind: string;
    apiVersion: string;
    fields: FieldSchema[];
}

/**
 * Context information for current parsing position
 */
export interface ParsingContext {
    resourceType?: string;    // e.g., "Deployment", "Service"
    apiVersion?: string;
    currentPath: string[];    // e.g., ["spec", "template", "spec", "containers"]
    indentStack: IndentLevel[];
    inBlockScalar: boolean;
    blockScalarIndent?: number;
    documentIndex: number;    // For multi-document YAML
}

/**
 * Indent level tracking
 */
export interface IndentLevel {
    indent: number;
    key: string;
    type: 'object' | 'array';
    lineNumber: number;
}

/**
 * Fix suggestion with confidence score
 */
export interface FixSuggestion {
    lineNumber: number;
    type: FixType;
    original: string;
    fixed: string;
    reason: string;
    confidence: number;       // 0.0 - 1.0
    severity: LineSeverity;
    metadata?: Record<string, any>;
}

export type FixType =
    | 'missing-colon'
    | 'missing-space'
    | 'indentation'
    | 'duplicate-key'
    | 'type-coercion'
    | 'field-relocation'
    | 'list-restructure'
    | 'orphaned-value'
    | 'field-normalization'
    | 'quote-balance'
    | 'bracket-balance';

/**
 * Validation result
 */
export interface ValidationResult {
    isValid: boolean;
    fixes: FixSuggestion[];
    errors: ValidationError[];
    warnings: ValidationWarning[];
    fixedYaml?: string;
    confidence: number;       // Overall confidence in fixes
}

export interface ValidationError {
    line: number;
    column?: number;
    message: string;
    severity: LineSeverity;
    code?: string;
}

export interface ValidationWarning {
    line: number;
    message: string;
    suggestion?: string;
}

/**
 * Fixer options
 */
export interface FixerOptions {
    confidenceThreshold: number;  // Default: 0.8
    aggressive: boolean;           // If true, lower threshold to 0.6
    maxIterations: number;         // Default: 3
    enableLearning: boolean;       // Enable sibling pattern learning
    enableRelocation: boolean;     // Enable field relocation
    indentSize: number;            // Default: 2
}

/**
 * Pattern matching result
 */
export interface PatternMatch {
    matched: boolean;
    confidence: number;
    suggestion?: string;
    metadata?: Record<string, any>;
}

/**
 * Type expectation for a field
 */
export interface TypeExpectation {
    field: string;
    expectedType: FieldType;
    context?: string;         // Where this expectation applies
    examples?: string[];      // Example valid values
}
