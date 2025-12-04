/**
 * Type Registry
 * Maps Kubernetes fields to their expected types
 */

import type { FieldType, TypeExpectation } from '../semantic/types.js';

/**
 * Type expectations for common Kubernetes fields
 */
export const TYPE_EXPECTATIONS: TypeExpectation[] = [
    // Boolean fields
    { field: 'hostNetwork', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'hostPID', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'hostIPC', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'readOnly', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'privileged', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'allowPrivilegeEscalation', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'runAsNonRoot', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'stdin', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'stdinOnce', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'tty', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'immutable', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'suspend', expectedType: 'boolean', examples: ['true', 'false'] },
    { field: 'paused', expectedType: 'boolean', examples: ['true', 'false'] },

    // Number fields
    { field: 'replicas', expectedType: 'number', examples: ['1', '3', '5'] },
    { field: 'port', expectedType: 'number', examples: ['80', '443', '8080'] },
    { field: 'containerPort', expectedType: 'number', examples: ['80', '443', '8080'] },
    { field: 'targetPort', expectedType: 'number', examples: ['80', '443', '8080'] },
    { field: 'hostPort', expectedType: 'number', examples: ['80', '443', '8080'] },
    { field: 'nodePort', expectedType: 'number', examples: ['30000', '30080', '31000'] },
    { field: 'initialDelaySeconds', expectedType: 'number', examples: ['10', '30', '60'] },
    { field: 'timeoutSeconds', expectedType: 'number', examples: ['1', '5', '10'] },
    { field: 'periodSeconds', expectedType: 'number', examples: ['10', '30', '60'] },
    { field: 'successThreshold', expectedType: 'number', examples: ['1', '2', '3'] },
    { field: 'failureThreshold', expectedType: 'number', examples: ['3', '5', '10'] },
    { field: 'terminationGracePeriodSeconds', expectedType: 'number', examples: ['30', '60', '120'] },
    { field: 'minReadySeconds', expectedType: 'number', examples: ['0', '10', '30'] },
    { field: 'revisionHistoryLimit', expectedType: 'number', examples: ['10', '5', '3'] },
    { field: 'progressDeadlineSeconds', expectedType: 'number', examples: ['600', '300', '900'] },
    { field: 'completions', expectedType: 'number', examples: ['1', '5', '10'] },
    { field: 'parallelism', expectedType: 'number', examples: ['1', '2', '5'] },
    { field: 'backoffLimit', expectedType: 'number', examples: ['6', '3', '10'] },
    { field: 'activeDeadlineSeconds', expectedType: 'number', examples: ['100', '300', '600'] },
    { field: 'ttlSecondsAfterFinished', expectedType: 'number', examples: ['100', '300', '600'] },
    { field: 'successfulJobsHistoryLimit', expectedType: 'number', examples: ['3', '5', '10'] },
    { field: 'failedJobsHistoryLimit', expectedType: 'number', examples: ['1', '3', '5'] },
    { field: 'runAsUser', expectedType: 'number', examples: ['1000', '0', '65534'] },
    { field: 'runAsGroup', expectedType: 'number', examples: ['1000', '0', '65534'] },
    { field: 'fsGroup', expectedType: 'number', examples: ['1000', '0', '65534'] },
    { field: 'priority', expectedType: 'number', examples: ['0', '100', '1000'] },

    // String fields
    { field: 'name', expectedType: 'string', examples: ['my-app', 'frontend', 'backend'] },
    { field: 'namespace', expectedType: 'string', examples: ['default', 'kube-system', 'production'] },
    { field: 'image', expectedType: 'string', examples: ['nginx:latest', 'redis:6.0', 'postgres:13'] },
    { field: 'imagePullPolicy', expectedType: 'string', examples: ['Always', 'IfNotPresent', 'Never'] },
    { field: 'restartPolicy', expectedType: 'string', examples: ['Always', 'OnFailure', 'Never'] },
    { field: 'dnsPolicy', expectedType: 'string', examples: ['ClusterFirst', 'Default', 'None'] },
    { field: 'type', expectedType: 'string', examples: ['ClusterIP', 'NodePort', 'LoadBalancer'] },
    { field: 'protocol', expectedType: 'string', examples: ['TCP', 'UDP', 'SCTP'] },
    { field: 'mountPath', expectedType: 'string', examples: ['/data', '/var/log', '/etc/config'] },
    { field: 'subPath', expectedType: 'string', examples: ['config.yaml', 'data', 'logs'] },
    { field: 'path', expectedType: 'string', examples: ['/', '/api', '/health'] },
    { field: 'pathType', expectedType: 'string', examples: ['Prefix', 'Exact', 'ImplementationSpecific'] },
    { field: 'storageClassName', expectedType: 'string', examples: ['standard', 'fast', 'ssd'] },
    { field: 'volumeMode', expectedType: 'string', examples: ['Filesystem', 'Block'] },
    { field: 'concurrencyPolicy', expectedType: 'string', examples: ['Allow', 'Forbid', 'Replace'] },
    { field: 'schedule', expectedType: 'string', examples: ['*/5 * * * *', '0 0 * * *', '@hourly'] },
    { field: 'apiVersion', expectedType: 'string', examples: ['v1', 'apps/v1', 'batch/v1'] },
    { field: 'kind', expectedType: 'string', examples: ['Pod', 'Deployment', 'Service'] },

    // Object fields
    { field: 'metadata', expectedType: 'object' },
    { field: 'spec', expectedType: 'object' },
    { field: 'template', expectedType: 'object' },
    { field: 'selector', expectedType: 'object' },
    { field: 'labels', expectedType: 'object' },
    { field: 'annotations', expectedType: 'object' },
    { field: 'resources', expectedType: 'object' },
    { field: 'limits', expectedType: 'object' },
    { field: 'requests', expectedType: 'object' },
    { field: 'securityContext', expectedType: 'object' },
    { field: 'affinity', expectedType: 'object' },
    { field: 'nodeSelector', expectedType: 'object' },
    { field: 'httpGet', expectedType: 'object' },
    { field: 'tcpSocket', expectedType: 'object' },
    { field: 'exec', expectedType: 'object' },
    { field: 'valueFrom', expectedType: 'object' },
    { field: 'configMapKeyRef', expectedType: 'object' },
    { field: 'secretKeyRef', expectedType: 'object' },
    { field: 'fieldRef', expectedType: 'object' },
    { field: 'resourceFieldRef', expectedType: 'object' },

    // Array fields
    { field: 'containers', expectedType: 'array' },
    { field: 'initContainers', expectedType: 'array' },
    { field: 'volumes', expectedType: 'array' },
    { field: 'volumeMounts', expectedType: 'array' },
    { field: 'env', expectedType: 'array' },
    { field: 'envFrom', expectedType: 'array' },
    { field: 'ports', expectedType: 'array' },
    { field: 'command', expectedType: 'array' },
    { field: 'args', expectedType: 'array' },
    { field: 'tolerations', expectedType: 'array' },
    { field: 'imagePullSecrets', expectedType: 'array' },
    { field: 'finalizers', expectedType: 'array' },
    { field: 'ownerReferences', expectedType: 'array' },
    { field: 'accessModes', expectedType: 'array' },
    { field: 'rules', expectedType: 'array' },
    { field: 'paths', expectedType: 'array' },
    { field: 'tls', expectedType: 'array' },
    { field: 'subjects', expectedType: 'array' },
    { field: 'verbs', expectedType: 'array' },
    { field: 'apiGroups', expectedType: 'array' },
    { field: 'resources', expectedType: 'array', context: 'rbac' },
    { field: 'resourceNames', expectedType: 'array' },
];

/**
 * Get expected type for a field
 */
export function getExpectedType(fieldName: string, context?: string): FieldType | undefined {
    const expectation = TYPE_EXPECTATIONS.find(exp =>
        exp.field === fieldName && (!exp.context || exp.context === context)
    );
    return expectation?.expectedType;
}

/**
 * Check if a value matches the expected type
 */
export function matchesExpectedType(fieldName: string, value: string, context?: string): boolean {
    const expectedType = getExpectedType(fieldName, context);
    if (!expectedType) return true; // Unknown field, assume valid

    switch (expectedType) {
        case 'boolean':
            return value === 'true' || value === 'false';
        case 'number':
            return !isNaN(Number(value));
        case 'string':
            return typeof value === 'string';
        case 'object':
            return false; // Objects should not have inline values
        case 'array':
            return false; // Arrays should not have inline values
        default:
            return true;
    }
}

/**
 * Coerce value to expected type
 */
export function coerceToType(fieldName: string, value: string, context?: string): string {
    const expectedType = getExpectedType(fieldName, context);
    if (!expectedType) return value;

    switch (expectedType) {
        case 'number':
            // Convert word numbers to digits
            const wordToNumber: Record<string, string> = {
                'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
                'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
                'ten': '10',
            };
            return wordToNumber[value.toLowerCase()] || value;
        case 'boolean':
            // Normalize boolean values
            if (value.toLowerCase() === 'yes' || value === '1') return 'true';
            if (value.toLowerCase() === 'no' || value === '0') return 'false';
            return value;
        default:
            return value;
    }
}

/**
 * Get example values for a field
 */
export function getExampleValues(fieldName: string): string[] {
    const expectation = TYPE_EXPECTATIONS.find(exp => exp.field === fieldName);
    return expectation?.examples || [];
}
