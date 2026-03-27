import * as fs from 'fs';

// -- 1. Fix Layout.tsx --
let layoutContent = fs.readFileSync('components/Layout.tsx', 'utf8');

if (!layoutContent.includes('import { ArgenLogo }')) {
  layoutContent = layoutContent.replace(
    /import {([^}]+)} from 'lucide-react';/,
    "import { $1 } from 'lucide-react';\nimport { ArgenLogo } from './ArgenLogo';"
  );
}

const layoutStartStr = '{companyData.logo ? (';
const layoutEndStr = ')}';

const startIndexLayout = layoutContent.indexOf(layoutStartStr);
const endIndexLayout = layoutContent.indexOf(layoutEndStr, startIndexLayout);

if (startIndexLayout !== -1 && endIndexLayout !== -1) {
  const replacement = `<div className="w-full h-full flex flex-col items-center justify-center pt-2 pb-4">
            <ArgenLogo dark={true} scale={0.7} />
          </div>`;
  layoutContent = layoutContent.substring(0, startIndexLayout) + replacement + layoutContent.substring(endIndexLayout + layoutEndStr.length);
}

fs.writeFileSync('components/Layout.tsx', layoutContent);

// -- 2. Fix Login.tsx --
let loginContent = fs.readFileSync('pages/Login.tsx', 'utf8');

if (!loginContent.includes('import { ArgenLogo }')) {
  loginContent = loginContent.replace(
    /import {([^}]+)} from 'lucide-react';/,
    "import { $1 } from 'lucide-react';\nimport { ArgenLogo } from '../components/ArgenLogo';"
  );
}

const loginTargetTarget = `<div className="bg-white p-4 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.3)] border border-white/20 transition-all hover:scale-[1.02] mx-4 mb-4">
    <img src={displayLogo} alt="Logo" className="max-h-24 md:max-h-28 object-contain" referrerPolicy="no-referrer" />
  </div>`;
  
if (loginContent.includes(loginTargetTarget)) {
  loginContent = loginContent.replace(loginTargetTarget, `<div className="mb-10"><ArgenLogo dark={false} scale={1.2} /></div>`);
} else {
  // Try alternative replacement (if displayLogo block matches differently)
  const fallbackStart = '{displayLogo ? (';
  const fallbackEnd = ')}';
  const loginStartIndex = loginContent.indexOf(fallbackStart);
  let loginEndIndex = loginContent.indexOf('</div>', loginContent.indexOf(fallbackEnd, loginStartIndex)); // to grab the enclosing div maybe? No, let's keep it safe.
  
  if (loginStartIndex !== -1) {
     const closeIndex = loginContent.indexOf(')}', loginStartIndex);
     if (closeIndex !== -1) {
       loginContent = loginContent.substring(0, loginStartIndex) + `<div className="mb-10 mt-4"><ArgenLogo dark={false} scale={1.2} /></div>` + loginContent.substring(closeIndex + 2);
     }
  }
}

fs.writeFileSync('pages/Login.tsx', loginContent);

console.log('Layout.tsx and Login.tsx have been refactored to use native ArgenLogo!');
