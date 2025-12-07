
import { MultiPassFixer } from './src/semantic/intelligent-fixer.ts';

const inputs = [
    // Case 1: Inferred Deployment (spec.replicas + selector + template)
    `metadata:
  name: my-dep
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    spec:
      containers:
      - name: nginx
        image: nginx`,

    // Case 2: Inferred Service (spec.type + spec.ports)
    `metadata:
  name: my-svc
spec:
  type: ClusterIP
  ports:
  - port: 80`,

    // Case 3: Inferred ConfigMap (data only)
    `metadata:
  name: my-config
data:
  key: value`,

    // Case 4: Inferred Pod (spec.containers only)
    `metadata:
  name: my-pod
spec:
  containers:
  - name: nginx
    image: nginx`,

    // Case 5: Missing apiVersion for known Kind (Ingress)
    `kind: Ingress
metadata:
  name: my-ingress
spec:
  rules: []`,

    // Case 6: Missing apiVersion for RBAC (Role)
    `kind: Role
metadata:
  name: my-role
rules: []`
];

async function run() {
    const fixer = new MultiPassFixer();
    for (const [i, input] of inputs.entries()) {
        console.log(`\n=== CASE ${i + 1} INPUT ===`);
        console.log(input);
        const result = await fixer.fix(input);
        console.log(`=== CASE ${i + 1} OUTPUT ===`);
        const firstLine = result.content.split('\n')[0];
        const secondLine = result.content.split('\n')[1];
        console.log(firstLine);
        console.log(secondLine); // Check kind/apiVersion
    }
}

run().catch(console.error);
