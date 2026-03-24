import fs from 'fs';

let css = fs.readFileSync('src/index.css', 'utf8');

// Replace standard variables
css = css.replace(/--color-main:.*/, '--color-main: #F6F8F7;');
css = css.replace(/--color-card:.*/, '--color-card: #FFFFFF;');
css = css.replace(/--color-tx-primary:.*/, '--color-tx-primary: #1C1F1E;');
css = css.replace(/--color-tx-secondary:.*/, '--color-tx-secondary: #6B7280;');
css = css.replace(/--color-bd-lines:.*/, '--color-bd-lines: #E3E8E6;');
css = css.replace(/--color-accent:.*/, '--color-accent: #2F7D6B;\n  --color-accent-hover: #27695A;\n  --color-accent-active: #1F5448;\n  --color-sidebar: #1E2A28;');

// Modernize buttons (remove flashy gradients)
// We remove lines 184 to 203 (approx) from index.css that define the button gradients
css = css.replace(/\/\* Botones primarios[\s\S]*?\}\s*\}\s*/, '}'); 
// But wait, the regex above might fail if not exactly matched. Let's just do a string replace for the entire glassmorphism and buttons sections if possible.
// Actually, safely removing the button.bg-accent rule block:
css = css.replace(/button\.bg-accent[\s\S]*?(?=\n\n|\n\/\*)/g, '');

// Clean up glass-card and aurora to be pure SaaS
css = css.replace(/\.glass-card \{[\s\S]*?\}/, '.glass-card {\n  background: var(--color-card);\n  border: 1px solid var(--color-bd-lines);\n  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);\n  border-radius: 16px;\n  transition: all 0.2s ease;\n}');
css = css.replace(/\.glass-card:hover \{[\s\S]*?\}/, '.glass-card:hover {\n  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);\n}');

fs.writeFileSync('src/index.css', css);

// 2. Fix Layout.tsx
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
// remove aurora background
layout = layout.replace('bg-slate-50 dark:bg-slate-900 bg-aurora', 'bg-main dark:bg-slate-900');
// update sidebar styling
layout = layout.replace(/bg-emerald-600 dark:bg-slate-900\/60[\s\S]*?shadow-2xl/, 'bg-[#1E2A28] dark:bg-[#1E2A28] border-r border-[#1E2A28]/20 flex flex-col transition-transform duration-300 ease-in-out shadow-xl');
// update active item styling
layout = layout.replace('? "bg-emerald-900 shadow-inner text-white border border-emerald-800/50 scale-105 font-bold"', '? "bg-accent shadow-md text-white font-semibold"');
layout = layout.replace('text-emerald-600 scale-105', 'text-white font-semibold');
// update inactive hover item styling
layout = layout.replace('text-white/90 active:bg-white/20 md:hover:text-white md:hover:bg-white/10', 'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20');
// ensure logo text has correct color
layout = layout.replace('text-emerald-600 p-1.5', 'text-[#1E2A28] p-1.5'); 

fs.writeFileSync('src/components/Layout.tsx', layout);
console.log('Palette applied');
