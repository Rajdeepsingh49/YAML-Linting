// Direct test of the aggressive fixer
const testYAML = `apiVersion: v1
kind: Pod
meta
 name: broken-app
	namespace: default
   labels:
    app:frontend
  tier: web
meta &anchor
  name: test`;

console.log("=== ORIGINAL ===");
console.log(testYAML);

// Simulate the aggressive fixer
let lines = testYAML.split('\n');
const targetStyle = 2;
let fixedCount = 0;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const original = line;
    let wasModified = false;

    // Remove trailing whitespace
    if (line.match(/\s+$/)) {
        line = line.replace(/\s+$/, '');
        wasModified = true;
    }

    // Convert tabs
    if (line.includes('\t')) {
        line = line.replace(/\t/g, '  ');
        wasModified = true;
    }

    // Fix indentation
    const match = line.match(/^(\s*)(.*)/);
    if (match && match[2].trim().length > 0) {
        const currentIndent = match[1].length;
        const content = match[2];
        let newIndent = Math.round(currentIndent / targetStyle) * targetStyle;
        if (newIndent === 0 && currentIndent > 0) {
            newIndent = targetStyle;
        }
        if (newIndent !== currentIndent) {
            line = ' '.repeat(newIndent) + content;
            wasModified = true;
        }
    }

    // Fix colon spacing
    const colonMatch = line.match(/^(\s*[^\s:]+):(?!\s)(\S.*)/);
    if (colonMatch && !colonMatch[1].trim().match(/^https?$/)) {
        line = line.replace(/^(\s*[^\s:]+):(?!\s)(\S.*)/, '$1: $2');
        wasModified = true;
    }

    // Add missing colons
    const trimmed = line.trim();
    const k8sKeys = ['metadata', 'spec', 'meta'];
    if (!trimmed.includes(':') && !trimmed.startsWith('-') && !trimmed.startsWith('#') && trimmed.length > 0) {
        const isKnownKey = k8sKeys.some(key => trimmed.toLowerCase() === key.toLowerCase());
        if (isKnownKey) {
            line = line.replace(trimmed, trimmed + ':');
            wasModified = true;
            console.log(`Line ${i + 1}: Added colon to "${trimmed}"`);
        }
    }

    if (wasModified) {
        fixedCount++;
        console.log(`Line ${i + 1}: "${original}" -> "${line}"`);
    }

    lines[i] = line;
}

console.log("\n=== FIXED ===");
console.log(lines.join('\n'));
console.log(`\nFixed ${fixedCount} lines`);
