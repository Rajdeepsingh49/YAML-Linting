
import { MultiPassFixer } from './src/semantic/intelligent-fixer.ts';

const input = `metadata:
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
        image: nginx`;

async function run() {
    const fixer = new MultiPassFixer();
    console.log("=== INPUT ===");
    console.log(input);
    const result = await fixer.fix(input);
    console.log("\n=== OUTPUT ===");
    console.log(result.content);
    console.log("\n=== CHANGES ===");
    console.log(JSON.stringify(result.changes, null, 2));
}

run().catch(console.error);
