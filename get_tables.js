const fs = require('fs');
const path = require('path');

function findTables(dir) {
    let tables = new Set();
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findTables(fullPath).forEach(t => tables.add(t));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.match(/from\(['"]([^'"]+)['"]\)/g);
            if (matches) {
                matches.forEach(m => {
                    const table = m.replace(/from\(['"]/, '').replace(/['"]\)/, '');
                    tables.add(table);
                });
            }
        }
    }
    return tables;
}

console.log(Array.from(findTables('./src')));
