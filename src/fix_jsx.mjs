import * as fs from 'fs';

let content = fs.readFileSync('pages/Login.tsx', 'utf8');

const searchTarget = `  {displayLogo ? (
  {displayLogo ? (
     <div className="mb-4">
       <img src={displayLogo} alt="Logo" className="w-full max-w-[280px] object-contain drop-shadow-2xl mx-auto" referrerPolicy="no-referrer" />
     </div>
   ) : (
     <div className="h-28"></div>
   )}
  ) : (
  <div className="flex flex-col items-center justify-center">
    <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-2 drop-shadow-lg">
      <div className="bg-white text-accent p-2 rounded-xl leading-none shadow-xl">AR</div> GEN
    </h1>
    <span className="font-bold text-xs tracking-[0.3em] uppercase text-center mt-2 leading-tight text-white/90 drop-shadow-md">
      SOFTWARE
    </span>
  </div>
  )}`;

if (content.includes(searchTarget)) {
  content = content.replace(searchTarget, '  <MagicLogo scale={1} className="drop-shadow-2xl mb-8" />');
} else {
  // If the exact spaces fail, just regex replace the whole block from the double {displayLogo to the closing )}
  content = content.replace(/\{displayLogo \? \([\s\S]*?SOFTWARE\s*<\/span>\s*<\/div>\s*\)\}/, '<MagicLogo scale={1} className="drop-shadow-2xl mb-8" />');
}

fs.writeFileSync('pages/Login.tsx', content);
