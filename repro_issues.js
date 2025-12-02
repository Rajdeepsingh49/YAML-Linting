
// Mock the class for the script since it's TS source
class MockValidator {
    detectIndentationStyle(content) {
        const lines = content.split('\n');
        const counts = { 2: 0, 4: 0 };
        for (const line of lines) {
            const match = line.match(/^(\s+)/);
            if (!match) continue;
            const spaces = match[1].length;
            if (spaces > 0) {
                if (spaces % 4 === 0) counts[4]++;
                if (spaces % 2 === 0) counts[2]++;
            }
        }
        return counts[4] > counts[2] ? 4 : 2;
    }

    fix(content, options = { style: 'auto' }) {
        let lines = content.split('\n');
        const targetStyle = options.style === 'auto' ? this.detectIndentationStyle(content) : parseInt(options.style);
        const changes = [];
        let fixedCount = 0;
        const mode = options.mode || 'all';

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const originalLine = line;
            let modified = false;

            // Fix Syntax
            if (mode === 'all' || mode === 'syntax') {
                // Colon fix
                const colonMatch = line.match(/^(\s*[^\s:]+):(?!\s)(\S.*)/);
                if (colonMatch) {
                    const keyPart = colonMatch[1];
                    const valuePart = colonMatch[2];
                    if (!keyPart.trim().match(/^https?$/)) {
                        line = `${keyPart}: ${valuePart}`;
                        modified = true;
                    }
                }

                // List fix (MISSING IN ORIGINAL)
                // -item -> - item
                const listMatch = line.match(/^(\s*)-(?!\s)(\S.*)/);
                if (listMatch) {
                    line = `${listMatch[1]}- ${listMatch[2]}`;
                    modified = true;
                }
            }

            // Fix Indentation
            if (mode === 'all' || mode === 'indentation') {
                if (line.trim().length > 0) {
                    const match = line.match(/^(\s+)(.*)/);
                    if (match) {
                        const currentIndent = match[1].length;
                        const content = match[2];
                        const levels = currentIndent / targetStyle;
                        const nearestLevel = Math.round(levels);
                        const newIndent = nearestLevel * targetStyle;
                        if (newIndent !== currentIndent) {
                            line = ' '.repeat(newIndent) + content;
                            modified = true;
                        }
                    }
                }
            }

            if (modified) {
                lines[i] = line;
                fixedCount++;
            }
        }
        return { content: lines.join('\n'), fixedCount };
    }
}

const validator = new MockValidator();

const badYaml = `
apiVersion:v1
kind: Pod
metadata:
  name:test
  labels:
   app:nginx
spec:
  containers:
  -name: nginx
   image:nginx
`;

console.log("--- Original ---");
console.log(badYaml);

const fixedSyntax = validator.fix(badYaml, { mode: 'syntax' });
console.log("\n--- Fixed Syntax ---");
console.log(fixedSyntax.content);

const fixedIndent = validator.fix(badYaml, { mode: 'indentation', style: '2' });
console.log("\n--- Fixed Indentation ---");
console.log(fixedIndent.content);

const fixedAll = validator.fix(badYaml, { mode: 'all', style: '2' });
console.log("\n--- Fixed All ---");
console.log(fixedAll.content);
