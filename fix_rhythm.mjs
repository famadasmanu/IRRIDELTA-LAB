import fs from 'fs';

const cssFile = 'src/index.css';
let css = fs.readFileSync(cssFile, 'utf8');
css = css.replace('--color-main: #F4F7F6;', '--color-main: #ecfdf5; /* Verde menta mega suave para armonizar */');
fs.writeFileSync(cssFile, css);

const layoutFile = 'src/components/Layout.tsx';
let txt = fs.readFileSync(layoutFile, 'utf8');
txt = txt.replace('? "glass-card shadow-lg text-emerald-600 scale-105 font-bold"', '? "bg-emerald-800 text-white shadow-xl border border-emerald-700/50 scale-105 font-bold"');
fs.writeFileSync(layoutFile, txt);

console.log('Fixed rhythm');
