const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Cursor', 'User', 'History');
let allEntries = [];

function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchDir(fullPath);
        } else if (file === 'entries.json') {
            try {
                const text = fs.readFileSync(fullPath, 'utf8');
                if (text.includes('Herramientas.tsx')) {
                    const data = JSON.parse(text);
                    data.entries.forEach(e => {
                        allEntries.push({ id: e.id, timestamp: e.timestamp, dir, fullPath });
                    });
                }
            } catch (e) {}
        }
    }
}

searchDir(historyDir);

if (allEntries.length > 0) {
    allEntries.sort((a, b) => a.timestamp - b.timestamp);
    const outDir = path.join(__dirname, 'rescue_herramientas');
    if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir); }
    
    console.log("Found: ", allEntries.length, " entries");
    const recent = allEntries.slice(-15);
    recent.forEach((entry, idx) => {
        const fileToRecover = path.join(entry.dir, entry.id);
        const dateStr = new Date(entry.timestamp).toISOString().replace(/:/g, '-').slice(0, 19);
        const dest = path.join(outDir, `Herramientas_${idx}_${dateStr}.tsx`);
        try {
            fs.copyFileSync(fileToRecover, dest);
            console.log("Saved", dest);
        } catch(e){}
    });
} else {
    console.log("Not found in Cursor. Let's try Code.");
    const codeDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
    // I can do the same loop here but just for text search.
}
