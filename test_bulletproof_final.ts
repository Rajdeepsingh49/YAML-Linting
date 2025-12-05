import { MultiPassFixer } from './src/semantic/intelligent-fixer';

// Test YAML with all 3 patterns
const testYaml = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: nginx
        livenessProbe:
          httpGet
          tcpSocket:
            port: 8080
          httpGet:
            path: /health
            port: 8080
        readinessProbe:
          exec
            command:
            - cat
            - /tmp/healthy
          httpGet:
            path: /ready
            port: 8080
        env:
        - DATABASE_URL
          value: "postgres://localhost"
        resources
          requests
            cpu: 100m
          limits
            cpu: 500m
---
apiVersion: v1
kind: Service
metadata:
  name: test-svc
spec:
  selector
    app: web
  ports:
  - port: 80
    target
      port: 8080
  type: ClusterIP
  sessionAffinityConfig
    clientIP
      timeoutSeconds: 10800
`;

async function runFinalTest() {
    console.log('\\n=== BULLETPROOF FINAL TEST ===\\n');

    const fixer = new MultiPassFixer({
        indentSize: 2,
        aggressive: true,
        confidenceThreshold: 0.6
    });

    const result = await fixer.fix(testYaml);

    console.log('--- Fixed YAML ---');
    console.log(result.content);

    console.log('\\n=== PATTERN VERIFICATION ===');
    const fixed = result.content;

    // Pattern 1: Missing colons on parent keywords (Multi-pass check)
    const hasResourcesColon = fixed.match(/resources:/);
    const hasRequestsColon = fixed.match(/requests:/);
    const hasLimitsColon = fixed.match(/limits:/);
    const hasSelectorColon = fixed.match(/selector:/);
    const hasTargetColon = fixed.match(/target:/);
    const hasSessionAffinityColon = fixed.match(/sessionAffinityConfig:/);
    const hasClientIPColon = fixed.match(/clientIP:/);

    console.log('\\nPattern 1 (Missing Colons):');
    console.log('✓ resources:', hasResourcesColon ? 'PASS' : 'FAIL');
    console.log('✓ requests:', hasRequestsColon ? 'PASS' : 'FAIL');
    console.log('✓ limits:', hasLimitsColon ? 'PASS' : 'FAIL');
    console.log('✓ selector:', hasSelectorColon ? 'PASS' : 'FAIL');
    console.log('✓ target:', hasTargetColon ? 'PASS' : 'FAIL');
    console.log('✓ sessionAffinityConfig:', hasSessionAffinityColon ? 'PASS' : 'FAIL');
    console.log('✓ clientIP:', hasClientIPColon ? 'PASS' : 'FAIL');

    // Pattern 2: Probe Deduplication (Priority Logic)
    console.log('\\nPattern 2 (Probe Deduplication):');

    // Liveness: tcpSocket vs httpGet (httpGet priority 3 > tcpSocket priority 2)
    // But wait, in the test YAML:
    // httpGet (no children)
    // tcpSocket (with children)
    // httpGet (with children)
    // Logic: Sort by hasChildren (desc), priority (desc), index (desc)
    // Both tcpSocket and 2nd httpGet have children.
    // Priority: httpGet (3) > tcpSocket (2).
    // So should keep httpGet.

    const livenessSection = fixed.substring(fixed.indexOf('livenessProbe:'), fixed.indexOf('readinessProbe:'));
    const livenessHttpGet = (livenessSection.match(/httpGet:/g) || []).length;
    const livenessTcpSocket = (livenessSection.match(/tcpSocket:/g) || []).length;

    console.log('✓ Liveness (httpGet > tcpSocket):', livenessHttpGet === 1 && livenessTcpSocket === 0 ? 'PASS' : `FAIL (http:${livenessHttpGet}, tcp:${livenessTcpSocket})`);

    // Readiness: exec vs httpGet (exec priority 4 > httpGet priority 3)
    const readinessSection = fixed.substring(fixed.indexOf('readinessProbe:'), fixed.indexOf('env:'));
    const readinessExec = (readinessSection.match(/exec:/g) || []).length;
    const readinessHttpGet = (readinessSection.match(/httpGet:/g) || []).length;

    console.log('✓ Readiness (exec > httpGet):', readinessExec === 1 && readinessHttpGet === 0 ? 'PASS' : `FAIL (exec:${readinessExec}, http:${readinessHttpGet})`);

    // Pattern 3: Probe Child Indentation
    console.log('\\nPattern 3 (Probe Indentation):');
    // Check indentation of children in readiness probe (exec command)
    // exec:
    //   command:
    //   - cat
    //   - /tmp/healthy

    const execIndex = fixed.indexOf('exec:');
    const commandIndex = fixed.indexOf('command:', execIndex);
    const execIndent = getIndent(fixed, execIndex);
    const commandIndent = getIndent(fixed, commandIndex);

    console.log(`✓ Indentation check (base: ${execIndent}, child: ${commandIndent}):`, commandIndent === execIndent + 2 ? 'PASS' : 'FAIL');

    // Overall results
    const allPassed = hasResourcesColon && hasRequestsColon && hasLimitsColon &&
        hasSelectorColon && hasTargetColon && hasSessionAffinityColon && hasClientIPColon &&
        livenessHttpGet === 1 && livenessTcpSocket === 0 &&
        readinessExec === 1 && readinessHttpGet === 0 &&
        commandIndent === execIndent + 2;

    console.log('\\n=== STATISTICS ===');
    console.log('Total fixes:', result.changes.length);
    console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');

    console.log('\\n=== OVERALL RESULT ===');
    console.log(allPassed ? '✅ ALL PATTERNS FIXED PERMANENTLY!' : '❌ Some patterns still present');
}

function getIndent(content: string, index: number): number {
    // Find start of line
    let lineStart = index;
    while (lineStart > 0 && content[lineStart - 1] !== '\n') {
        lineStart--;
    }

    // Count spaces
    let spaces = 0;
    while (content[lineStart + spaces] === ' ') {
        spaces++;
    }
    return spaces;
}

runFinalTest().catch(console.error);
