import fs from 'fs';

// 1. Fix Layout.tsx
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// The wrapper div (main background)
layout = layout.replace(
  '<div className="min-h-screen bg-main dark:bg-slate-900 flex transition-colors duration-200">',
  '<div className="min-h-screen bg-main dark:bg-slate-900 dark:bg-aurora flex transition-colors duration-200">'
);

// Sidebar wrapper
// Let's replace the whole className of aside
layout = layout.replace(
  /"fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-\[\#1E2A28\] text-white flex flex-col transition-transform duration-300 ease-in-out shadow-xl border-r border-\[\#1E2A28\]\/20"/,
  '"fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#1E2A28] dark:bg-slate-900/60 dark:backdrop-blur-2xl text-white flex flex-col transition-transform duration-300 ease-in-out shadow-xl dark:shadow-2xl border-r border-[#1E2A28]/20 dark:border-white/10"'
);

// Menu item wrapper class Logic
const activeRegex = /isActive\s*\?\s*"bg-accent text-white shadow-md font-medium"\s*:\s*"text-white\/70 hover:bg-white\/10 hover:text-white"/;
layout = layout.replace(activeRegex, `isActive ? "bg-accent dark:bg-emerald-500/20 text-white shadow-md font-medium dark:border dark:border-emerald-500/30" : "text-white/70 hover:bg-white/10 dark:hover:bg-slate-800/50 hover:text-white"`);

// Mobile Nav
layout = layout.replace(
  /isActive \? "text-accent dark:text-emerald-400" : "text-tx-secondary dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"/,
  'isActive ? "text-accent dark:text-emerald-400" : "text-tx-secondary dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"'
);

fs.writeFileSync('src/components/Layout.tsx', layout);

// 2. Fix index.css
let css = fs.readFileSync('src/index.css', 'utf8');

// Ensure Aurora is restored for dark mode
if (!css.includes('.bg-aurora {')) {
  // If we accidentally deleted aurora, let's inject it back
  // but it seems my last script just changed dark background-image to none.
}

css = css.replace(
  /\[data-theme="dark"\] \.bg-aurora \{\s*background-image: none;\s*\}/,
  `[data-theme="dark"] .bg-aurora, .dark .bg-aurora {\n  background-image: \n    radial-gradient(circle at 10% 20%, rgba(37, 211, 102, 0.08) 0%, transparent 40%),\n    radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 40%);\n}`
);

// We need to make sure Light Mode doesn't have aurora, but dark mode does.
css = css.replace(
  /\.bg-aurora \{\s*background-attachment: fixed;\s*\}/,
  `.bg-aurora {\n  background-image: none; /* No aurora in light mode */\n  background-size: 200% 200%;\n  animation: aurora 20s ease-in-out infinite;\n  background-attachment: fixed;\n}`
);

// Ensure that dark mode overrides work not just for [data-theme="dark"] but also for .dark
css = css.replace(
  /\[data-theme="dark"\] \{/g,
  '.dark, [data-theme="dark"] {'
);

fs.writeFileSync('src/index.css', css);

console.log('Restored dark mode while keeping SaaS light mode!');
