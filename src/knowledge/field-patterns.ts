/**
 * Kubernetes Field Patterns
 * Common field naming patterns and detection rules
 */

export interface FieldPattern {
    pattern: RegExp;
    description: string;
    examples: string[];
}

/**
 * Common Kubernetes field naming patterns
 */
export const FIELD_PATTERNS: FieldPattern[] = [
    {
        pattern: /^[a-z][a-zA-Z0-9]*$/,
        description: 'camelCase field (e.g., containerPort, hostNetwork)',
        examples: ['containerPort', 'hostNetwork', 'readinessProbe'],
    },
    {
        pattern: /^[a-z][a-z0-9-]*$/,
        description: 'lowercase with hyphens (e.g., image-pull-policy)',
        examples: ['image-pull-policy', 'service-account'],
    },
    {
        pattern: /^[a-z]+$/,
        description: 'simple lowercase (e.g., name, image, port)',
        examples: ['name', 'image', 'port', 'spec', 'metadata'],
    },
];

/**
 * Known Kubernetes field names (most common)
 */
export const KNOWN_FIELDS = new Set([
    // Top-level
    'apiVersion',
    'kind',
    'metadata',
    'spec',
    'status',
    'data',

    // Metadata
    'name',
    'namespace',
    'labels',
    'annotations',
    'uid',
    'resourceVersion',
    'generation',
    'creationTimestamp',
    'deletionTimestamp',
    'ownerReferences',
    'finalizers',

    // Spec (common across resources)
    'replicas',
    'selector',
    'template',
    'strategy',
    'minReadySeconds',
    'revisionHistoryLimit',
    'progressDeadlineSeconds',
    'paused',

    // Pod spec
    'containers',
    'initContainers',
    'volumes',
    'restartPolicy',
    'terminationGracePeriodSeconds',
    'dnsPolicy',
    'serviceAccountName',
    'serviceAccount',
    'nodeName',
    'nodeSelector',
    'affinity',
    'tolerations',
    'hostNetwork',
    'hostPID',
    'hostIPC',
    'securityContext',
    'imagePullSecrets',
    'hostname',
    'subdomain',
    'schedulerName',
    'priorityClassName',
    'priority',

    // Container
    'image',
    'imagePullPolicy',
    'command',
    'args',
    'workingDir',
    'ports',
    'env',
    'envFrom',
    'resources',
    'volumeMounts',
    'livenessProbe',
    'readinessProbe',
    'startupProbe',
    'lifecycle',
    'stdin',
    'stdinOnce',
    'tty',

    // Ports
    'containerPort',
    'hostPort',
    'protocol',
    'hostIP',

    // Env
    'value',
    'valueFrom',

    // Resources
    'limits',
    'requests',
    'cpu',
    'memory',
    'storage',

    // Volume mounts
    'mountPath',
    'subPath',
    'readOnly',

    // Probes
    'httpGet',
    'tcpSocket',
    'exec',
    'initialDelaySeconds',
    'timeoutSeconds',
    'periodSeconds',
    'successThreshold',
    'failureThreshold',

    // Service
    'type',
    'clusterIP',
    'externalIPs',
    'sessionAffinity',
    'loadBalancerIP',
    'loadBalancerSourceRanges',
    'externalName',
    'externalTrafficPolicy',
    'healthCheckNodePort',
    'publishNotReadyAddresses',

    // Service ports
    'port',
    'targetPort',
    'nodePort',

    // ConfigMap/Secret
    'binaryData',
    'stringData',
    'immutable',

    // Volume types
    'emptyDir',
    'hostPath',
    'configMap',
    'secret',
    'persistentVolumeClaim',
    'nfs',
    'awsElasticBlockStore',
    'gcePersistentDisk',
    'azureDisk',
    'azureFile',
    'csi',
    'projected',
    'downwardAPI',

    // PVC
    'accessModes',
    'storageClassName',
    'volumeMode',
    'volumeName',

    // Ingress
    'rules',
    'tls',
    'backend',
    'host',
    'http',
    'paths',
    'path',
    'pathType',
    'serviceName',
    'servicePort',

    // RBAC
    'subjects',
    'roleRef',
    'rules',
    'verbs',
    'apiGroups',
    'resources',
    'resourceNames',

    // Job/CronJob
    'schedule',
    'concurrencyPolicy',
    'suspend',
    'successfulJobsHistoryLimit',
    'failedJobsHistoryLimit',
    'completions',
    'parallelism',
    'backoffLimit',
    'activeDeadlineSeconds',
    'ttlSecondsAfterFinished',
]);

/**
 * Field aliases and common typos
 */
export const FIELD_ALIASES: Record<string, string[]> = {
    'metadata': ['metdata', 'meta', 'met'],
    'apiVersion': ['api', 'version', 'apiv'],
    'kind': ['type', 'resource'],
    'spec': ['specification', 'spc'],
    'replicas': ['replica', 'reps'],
    'containers': ['container', 'ctr'],
    'image': ['img', 'imageName'],
    'name': ['nm', 'id'],
    'namespace': ['ns', 'namespaces'],
    'labels': ['label', 'tags'],
    'annotations': ['annotation', 'notes'],
    'selector': ['select', 'sel'],
    'template': ['tmpl', 'temp'],
    'volumeMounts': ['volumeMount', 'mounts'],
    'volumes': ['volume', 'vol'],
    'env': ['environment', 'envs'],
    'ports': ['port'],
    'resources': ['resource', 'res'],
    'limits': ['limit'],
    'requests': ['request', 'req'],
};

/**
 * Check if a field name matches a known pattern
 */
export function matchesKubernetesPattern(fieldName: string): boolean {
    return FIELD_PATTERNS.some(pattern => pattern.pattern.test(fieldName));
}

/**
 * Check if a field is a known Kubernetes field
 */
export function isKnownField(fieldName: string): boolean {
    return KNOWN_FIELDS.has(fieldName);
}

/**
 * Get canonical field name from alias
 */
export function getCanonicalFieldName(fieldName: string): string | undefined {
    for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
        if (aliases.includes(fieldName.toLowerCase())) {
            return canonical;
        }
    }
    return undefined;
}
