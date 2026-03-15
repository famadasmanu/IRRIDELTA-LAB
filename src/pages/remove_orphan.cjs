const fs = require('fs');
let txt = fs.readFileSync('Trabajos.tsx', 'utf8');

const targetStr = 'className="p-2 text-gray-400 hover:text-gray-600';
let startIdx = txt.indexOf(targetStr);

if (startIdx > -1) {
    startIdx = txt.lastIndexOf('\n', startIdx);
    const lastParen = txt.lastIndexOf(')}');
    if (lastParen > startIdx) {
        const nextNL = txt.indexOf('\n', lastParen);
        const endIdx = nextNL > -1 ? nextNL : lastParen + 2;
        
        txt = txt.substring(0, startIdx) + txt.substring(endIdx);
        fs.writeFileSync('Trabajos.tsx', txt);
        console.log('Deleted orphaned modal syntax!');
    }
}
