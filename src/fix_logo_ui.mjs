import * as fs from 'fs';

// -- 1. Fix Login.tsx --
let loginContent = fs.readFileSync('pages/Login.tsx', 'utf8');

const loginTarget = '<img src={displayLogo} alt="Logo" className="max-h-36 max-w-[85%] object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />';
const loginReplacement = `
  <div className="bg-white p-4 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.3)] border border-white/20 transition-all hover:scale-[1.02] mx-4 mb-4">
    <img src={displayLogo} alt="Logo" className="max-h-24 md:max-h-28 object-contain" referrerPolicy="no-referrer" />
  </div>
`;
loginContent = loginContent.replace(loginTarget, loginReplacement.trim());
fs.writeFileSync('pages/Login.tsx', loginContent);


// -- 2. Fix Layout.tsx --
let layoutContent = fs.readFileSync('components/Layout.tsx', 'utf8');

const layoutTarget = '<img src={companyData.logo} alt={companyData.nombre} className="max-h-24 md:max-h-20 w-auto max-w-[85%] object-contain drop-shadow-md" referrerPolicy="no-referrer" />';
const layoutReplacement = `
  <div className="bg-white p-2.5 rounded-2xl shadow-lg border border-white/20 transition-all">
    <img src={companyData.logo} alt={companyData.nombre} className="max-h-16 md:max-h-14 w-auto object-contain" referrerPolicy="no-referrer" />
  </div>
`;
layoutContent = layoutContent.replace(layoutTarget, layoutReplacement.trim());
fs.writeFileSync('components/Layout.tsx', layoutContent);

console.log('UI beautifully refactored for the JPG logo.');
