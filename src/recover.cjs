const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Cursor', 'User', 'History');
let foundLayout = [];
let foundHerramientas = [];

function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                searchDir(fullPath);
            }
        } else if (file === 'entries.json') {
            try {
                const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                if (data.resource && typeof data.resource === 'string') {
                    if (data.resource.toLowerCase().endsWith('layout.tsx') && data.resource.toLowerCase().includes('irridelta')) {
                        foundLayout.push({ path: fullPath, entries: data.entries, resource: data.resource, dir });
                    }
                    if (data.resource.toLowerCase().endsWith('herramientas.tsx') && data.resource.toLowerCase().includes('irridelta')) {
                        foundHerramientas.push({ path: fullPath, entries: data.entries, resource: data.resource, dir });
                    }
                }
            } catch (e) {}
        }
    }
}

searchDir(historyDir);

if (foundLayout.length > 0) {
    // Sort by most recent timestamp in the last entry
    foundLayout.sort((a, b) => b.entries[b.entries.length-1].timestamp - a.entries[a.entries.length-1].timestamp);
    console.log("LAYOUT FOUND:", foundLayout[0].resource);
    const entries = foundLayout[0].entries;
    
    // Pick the entry right BEFORE today OR the first entry from today that before we started. 
    // We will just print the latest 5 entries so we can choose.
    console.log("Layout entries: ", entries.slice(-5).map(e => ({id: e.id, time: new Date(e.timestamp).toISOString()})));
}

if (foundHerramientas.length > 0) {
    foundHerramientas.sort((a, b) => b.entries[b.entries.length-1].timestamp - a.entries[a.entries.length-1].timestamp);
    console.log("HERRAMIENTAS FOUND:", foundHerramientas[0].resource);
    const entries = foundHerramientas[0].entries;
    console.log("Herramientas entries: ", entries.slice(-5).map(e => ({id: e.id, time: new Date(e.timestamp).toISOString()})));
}

console.log("Recovery scan finished.");
