# Kubernetes YAML Linter - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Validation Engine](#validation-engine)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Security & Best Practices](#security--best-practices)

---

## Overview

The Kubernetes YAML Linter is a production-ready web application for validating Kubernetes manifests with comprehensive schema checking, security analysis, and best practices recommendations.

### Key Features
- **Real-time Validation**: 500ms debounced validation as you type
- **Comprehensive Coverage**: Supports 10+ Kubernetes resource types
- **Security Checks**: Detects privileged containers, host network usage, and other security risks
- **Best Practices**: Recommends resource limits, health probes, and proper labeling
- **Export/Import**: Save and load YAML files with one click
- **Modern UI**: Ultra-modern dark theme with glassmorphism effects

### Supported Resource Types
- Deployment
- StatefulSet
- DaemonSet
- Service
- Pod
- ConfigMap
- Secret
- Ingress
- PersistentVolumeClaim
- Namespace
- Job
- CronJob

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Layout   │  │ CodeEditor   │  │  LinterOutput    │    │
│  │            │  │ (Monaco)     │  │  (Results)       │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
│         │                │                    │              │
│         └────────────────┴────────────────────┘              │
│                          │                                   │
│                    App Component                             │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTP POST /api/validate
                           │ (JSON: { yaml: string })
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Validation Engine                        │  │
│  │  ┌──────────────┐  ┌────────────────┐  ┌──────────┐ │  │
│  │  │ YAML Parser  │→ │ Schema Validator│→ │ Security │ │  │
│  │  │ (js-yaml)    │  │ (Custom Rules)  │  │ Checker  │ │  │
│  │  └──────────────┘  └────────────────┘  └──────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                    JSON Response                             │
│          { valid, errors, warnings, documentCount }          │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Vite (Build tool)
- Tailwind CSS v3 (Styling)
- Monaco Editor (Code editor)
- file-saver (Export functionality)

**Backend:**
- Node.js + Express
- js-yaml (YAML parsing)
- CORS enabled for local development

---

## Validation Engine

### Validation Flow

1. **YAML Parsing**: Parse YAML content using `js-yaml`
2. **Multi-Document Support**: Handle multiple documents in a single YAML file
3. **Common Validation**: Check required fields (apiVersion, kind, metadata)
4. **Resource-Specific Validation**: Apply rules based on resource kind
5. **Security Checks**: Analyze security context and configurations
6. **Best Practices**: Recommend improvements
7. **Error Categorization**: Separate errors from warnings

### Validation Rules

#### Common Fields (All Resources)
- ✅ `apiVersion` - Required
- ✅ `kind` - Required
- ✅ `metadata` - Required
- ✅ `metadata.name` - Required
- ⚠️ `metadata.labels` - Recommended for organization

#### Deployment/StatefulSet/DaemonSet
- ✅ `spec.selector` - Required
- ✅ `spec.selector.matchLabels` - Required
- ✅ `spec.template` - Required
- ✅ `spec.template.metadata.labels` - Required
- ✅ `spec.template.spec.containers` - Required (array)
- ✅ Label selector must match template labels
- ⚠️ `spec.replicas` >= 2 - Recommended for HA
- ⚠️ Container resource limits - Recommended
- ⚠️ Liveness/Readiness probes - Recommended

#### Service
- ✅ `spec.ports` - Required (array)
- ✅ `spec.ports[].port` - Required
- ⚠️ `spec.selector` - Recommended for traffic routing
- ⚠️ Port names - Recommended when multiple ports

#### Pod
- ✅ `spec.containers` - Required (array)
- ✅ `spec.containers[].name` - Required
- ✅ `spec.containers[].image` - Required
- ⚠️ Container security context - Recommended
- ⚠️ Resource limits - Recommended
- ⚠️ Health probes - Recommended

#### ConfigMap
- ⚠️ `data` or `binaryData` - At least one recommended

#### Secret
- ⚠️ `type` - Recommended (e.g., Opaque, kubernetes.io/tls)
- ⚠️ `data` or `stringData` - At least one recommended

#### Ingress
- ✅ `spec.rules` or `spec.defaultBackend` - At least one required
- ⚠️ `spec.rules[].host` - Recommended for each rule

#### PersistentVolumeClaim
- ✅ `spec.accessModes` - Required
- ✅ `spec.resources.requests` - Required

#### Namespace
- ⚠️ Avoid modifying system namespaces (default, kube-system)

---

## Security & Best Practices

### Security Checks

#### 1. Privileged Containers
```yaml
securityContext:
  privileged: true  # ⚠️ WARNING: Can access host resources
```
**Risk**: Privileged containers can access all host devices and bypass security policies.
**Recommendation**: Use only when absolutely necessary, prefer specific capabilities.

#### 2. Host Network
```yaml
hostNetwork: true  # ⚠️ WARNING: Bypasses network policies
```
**Risk**: Pods can access host network namespace, bypassing network isolation.
**Recommendation**: Use ClusterIP services instead.

#### 3. Image Tags
```yaml
image: nginx:latest  # ⚠️ WARNING: Avoid :latest tag
```
**Risk**: Latest tag can change unexpectedly, causing deployment issues.
**Recommendation**: Use specific version tags (e.g., `nginx:1.21.6`).

### Best Practices

#### 1. Resource Limits
```yaml
resources:
  limits:
    cpu: "500m"
    memory: "512Mi"
  requests:
    cpu: "250m"
    memory: "256Mi"
```
**Why**: Prevents resource exhaustion and ensures fair resource allocation.

#### 2. Health Probes
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```
**Why**: 
- Liveness: Automatic restart on failure
- Readiness: Controls traffic routing

#### 3. Labels
```yaml
metadata:
  labels:
    app: myapp
    version: v1.0.0
    environment: production
```
**Why**: Better organization, filtering, and service selection.

#### 4. High Availability
```yaml
spec:
  replicas: 3  # Minimum 2 for HA
```
**Why**: Ensures service availability during updates and failures.

---

## API Reference

### POST /api/validate

Validates Kubernetes YAML content.

**Request:**
```json
{
  "yaml": "apiVersion: v1\nkind: Pod\n..."
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "YAML is valid Kubernetes configuration",
  "documentCount": 1
}
```

**Response (With Warnings):**
```json
{
  "valid": true,
  "warnings": [
    {
      "document": 0,
      "kind": "Deployment",
      "field": "spec.template.spec.containers[0].resources.limits",
      "message": "BEST PRACTICE: Set resource limits to prevent resource exhaustion",
      "severity": "warning",
      "line": 15
    }
  ],
  "message": "YAML is valid with 1 warning(s)",
  "documentCount": 1
}
```

**Response (With Errors):**
```json
{
  "valid": false,
  "errors": [
    {
      "document": 0,
      "kind": "Deployment",
      "field": "spec.selector",
      "message": "Deployment spec requires 'selector' field",
      "severity": "error",
      "line": 8
    }
  ],
  "warnings": [],
  "message": "Found 1 error(s) and 0 warning(s)",
  "documentCount": 1
}
```

**Response (Syntax Error):**
```json
{
  "valid": false,
  "errors": [
    {
      "message": "YAML Syntax Error",
      "details": "bad indentation of a mapping entry (3:14)",
      "line": 3,
      "column": 14,
      "severity": "error"
    }
  ]
}
```

---

## Usage Examples

### Example 1: Valid Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21.6
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
```

**Result**: ✅ Valid with no warnings

### Example 2: Deployment with Warnings

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1  # ⚠️ Warning: < 2 replicas
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest  # ⚠️ Warning: :latest tag
        ports:
        - containerPort: 80
        # ⚠️ Warning: No resource limits
        # ⚠️ Warning: No liveness probe
        # ⚠️ Warning: No readiness probe
```

**Result**: ✅ Valid with 5 warnings

### Example 3: Invalid Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  # ❌ Error: Missing selector
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        # ❌ Error: Missing image
        ports:
        - containerPort: 80
```

**Result**: ❌ Invalid - 2 errors

---

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Building for Production

```bash
npm run build
```

### Project Structure

```
k8s-yaml-lint/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main layout with header/footer
│   │   ├── CodeEditor.tsx      # Monaco editor wrapper
│   │   └── LinterOutput.tsx    # Validation results display
│   ├── App.tsx                 # Main app component
│   ├── index.css               # Design system & styles
│   └── main.tsx                # Entry point
├── server/
│   └── index.js                # Express validation API
├── package.json
└── vite.config.ts
```

---

## Contributing

### Adding New Resource Types

1. Create validation function in `server/index.js`:
```javascript
const validateMyResource = (doc, yamlContent) => {
  const errors = [];
  // Add validation logic
  return errors;
};
```

2. Add case to validation router:
```javascript
case 'MyResource':
  errors = errors.concat(validateMyResource(doc, yamlContent));
  break;
```

### Adding New Validation Rules

Add checks to existing validation functions:
```javascript
if (!container.someField) {
  errors.push({
    field: 'path.to.field',
    message: 'Descriptive error message',
    severity: 'error', // or 'warning'
    line: getLineNumber(yamlContent, 'fieldName')
  });
}
```

---

## License

MIT License - See LICENSE file for details.
