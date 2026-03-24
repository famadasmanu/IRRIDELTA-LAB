import fs from 'fs';

let layout = fs.readFileSync('components/Layout.tsx', 'utf8');

// remove aurora background
layout = layout.replace('bg-main dark:bg-slate-900 bg-aurora text-slate-900', 'bg-main dark:bg-slate-900 text-tx-primary');
// update logo text color
// Because the previous text was <div className="bg-white text-emerald-600 p-1.5 rounded-lg leading-none">AR</div> GEN
// Wait, my view_file output showed: <div className="bg-white text-accent p-1.5 rounded-lg leading-none">AR</div> GEN
// Let's replace both just in case
layout = layout.replace('text-emerald-600 p-1.5', 'text-sidebar p-1.5');
layout = layout.replace('text-accent p-1.5', 'text-sidebar p-1.5');

// update active item styling
// The previous output might have been different due to other scripts. Let's use regex to replace the class logic completely
const classLogicRegex = /className=\{cn\([\s\S]*?"flex w-full text-left items-center justify-between px-3 py-3 rounded-xl transition-all min-h-\[44px\] appearance-none outline-none",[\s\S]*?isActive[\s\S]*?\?[\s\S]*?:[\s\S]*?\)\}/;

const newClassLogic = `className={cn(
 "flex w-full text-left items-center justify-between px-3 py-3 rounded-xl transition-all min-h-[44px] appearance-none outline-none",
 isActive
 ? "bg-accent shadow-md text-white font-medium"
 : "text-white/70 active:bg-white/20 hover:text-white hover:bg-white/10"
 )}`;

layout = layout.replace(classLogicRegex, newClassLogic);

fs.writeFileSync('components/Layout.tsx', layout);
console.log('Layout patched');
