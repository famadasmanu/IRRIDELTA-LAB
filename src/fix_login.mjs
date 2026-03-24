import * as fs from 'fs';

let content = fs.readFileSync('pages/Login.tsx', 'utf8');

// 1. Fix the image CSS
content = content.replace(
  /className="h-28 md:h-36 object-contain drop-shadow-md rounded-2xl"/g,
  'className="max-h-36 max-w-[85%] object-contain drop-shadow-2xl"'
);

// 2. Erase the ghost container box fallback
content = content.replace(
  /<div className="bg-card\/20 p-6 rounded-full mb-2 backdrop-blur-sm">\s*<Leaf className="text-white w-16 h-16" \/>\s*<\/div>/g,
  `<div className="flex flex-col items-center justify-center">
    <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-2 drop-shadow-lg">
      <div className="bg-white text-[#059669] p-2 rounded-xl leading-none shadow-xl">AR</div> GEN
    </h1>
    <span className="font-bold text-xs tracking-[0.3em] uppercase text-center mt-2 leading-tight text-white/90 drop-shadow-md">
      SOFTWARE
    </span>
  </div>`
);

fs.writeFileSync('pages/Login.tsx', content);
console.log('Login.tsx successfully updated');
