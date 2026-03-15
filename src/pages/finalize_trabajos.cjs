const fs = require('fs');

const filepath = 'Trabajos.tsx';
let content = fs.readFileSync(filepath, 'utf8');

if (!content.includes('Leaf,')) {
    content = content.replace('X, Tag, User, Link as LinkIcon', 'X, Tag, User, Link as LinkIcon, Leaf, CheckCircle');
}

const pStart = content.indexOf('{/* Pactado Detail Modal */}');
if (pStart > -1) {
    const veryEnd = content.lastIndexOf('</div>\n  );\n}');
    if (veryEnd > pStart) {
        content = content.substring(0, pStart) + content.substring(veryEnd);
    }
}

fs.writeFileSync(filepath, content, 'utf8');
console.log('Finalized fixes.');
