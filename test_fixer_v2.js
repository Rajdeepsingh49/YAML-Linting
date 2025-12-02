// Test the YAML fixer directly
const testYAML = `apiVersion: v1
kind: Pod
meta
 name: broken-app
	namespace: default
   labels:
    app:frontend
  tier: web`;

console.log("=== TESTING YAML FIXER ===");
console.log("Input:");
console.log(testYAML);

// Simulate the fixer
const lines = testYAML.split('\n');
const fixed = [];
let currentLevel = 0;
const indentSize = 2;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith('#')) {
        fixed.push(line);
        continue;
    }

    const originalIndent = line.match(/^(\s*)/)?.[1].length || 0;
    if (originalIndent < currentLevel * indentSize && originalIndent % indentSize === 0) {
        currentLevel = Math.floor(originalIndent / indentSize);
    }

    let indent = currentLevel * indentSize;
    let fixedContent = trimmed;

    // Add missing colons
    if (!fixedContent.includes(':') && !fixedContent.startsWith('-')) {
        const k8sKeys = ['apiVersion', 'kind', 'metadata', 'spec', 'meta'];
        const key = fixedContent.split(/\s+/)[0];
        if (k8sKeys.some(k => k.toLowerCase() === key.toLowerCase())) {
            fixedContent += ':';
            console.log(`Added colon to: ${fixedContent}`);
        }
    }

    // Fix colon spacing
    fixedContent = fixedContent.replace(/^([^\s:]+):(?!\s)(.+)/, '$1: $2');

    // Convert tabs
    fixedContent = fixedContent.replace(/\t/g, '  ');

    const finalLine = ' '.repeat(indent) + fixedContent;
    fixed.push(finalLine);

    console.log(`Line ${i + 1}: "${line}" → "${finalLine}"`);

    if (fixedContent.endsWith(':') && !fixedContent.startsWith('-')) {
        currentLevel++;
    }
}

console.log("\n=== OUTPUT ===");
console.log(fixed.join('\n'));
