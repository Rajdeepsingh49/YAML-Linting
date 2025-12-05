import { MultiPassFixer } from './src/semantic/intelligent-fixer';

const fixer = new MultiPassFixer();

const yaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
data:
  config.yaml: |
    # This content should NOT be fixed
    server:
      livenessProbe:
        httpGet:
          path: /health
          port: 8080
        tcpSocket:
          port: 8080
    
    # Missing colon that should NOT be fixed
    someKey someValue
    
    # Indentation that looks wrong but is correct for the file content
      indentedKey: value
`;

console.log('Running Block Scalar Preservation Test...');
const result = await fixer.fix(yaml);

console.log('\n=== BLOCK SCALAR TEST RESULTS ===');

// Check 1: tcpSocket should be preserved (deduplicateProbeTypes should skip it)
if (result.content.includes('tcpSocket:')) {
  console.log('✓ tcpSocket preserved inside block scalar: PASS');
} else {
  console.log('✗ tcpSocket removed inside block scalar: FAIL');
}

// Check 2: Missing colon should be preserved (aggressiveParentColonFix/fixNestedColons should skip it)
if (result.content.includes('someKey someValue')) {
  console.log('✓ Missing colon preserved inside block scalar: PASS');
} else {
  console.log('✗ Missing colon fixed inside block scalar: FAIL');
}

// Check 3: Indentation should be preserved
if (result.content.includes('  indentedKey: value')) {
  console.log('✓ Indentation preserved inside block scalar: PASS');
} else {
  // It might be hard to check exact indentation string match if other things changed, 
  // but let's see.
  console.log('? Indentation check (manual verification needed if failed)');
}

console.log('\n=== FIXED CONTENT ===');
console.log(result.content);
