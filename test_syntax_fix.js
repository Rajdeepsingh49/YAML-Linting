// Test the syntax fix logic
const testYaml = `apiVersion:apps/v1
kind:Deployment
metadata:
  name:nginx-deployment
  labels:
    app:nginx`;

console.log("=== ORIGINAL ===");
console.log(testYaml);

// Simulate the fix logic
const lines = testYaml.split('\n');
const fixed = [];

for (let line of lines) {
    let newLine = line;

    // Fix colon spacing
    const colonMatch = line.match(/^(\s*[^\s:]+):(?!\s)(\S.*)/);
    if (colonMatch) {
        const keyPart = colonMatch[1];
        const valuePart = colonMatch[2];
        if (!keyPart.trim().match(/^https?$/)) {
            newLine = `${keyPart}: ${valuePart}`;
            console.log(`Fixed: "${line}" -> "${newLine}"`);
        }
    }

    fixed.push(newLine);
}

console.log("\n=== FIXED ===");
console.log(fixed.join('\n'));
