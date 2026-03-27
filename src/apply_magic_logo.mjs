import * as fs from 'fs';

// -- 1. Fix Layout.tsx --
let layoutContent = fs.readFileSync('components/Layout.tsx', 'utf8');

if (!layoutContent.includes('import { MagicLogo }')) {
  layoutContent = layoutContent.replace(
    /import {([^}]+)} from 'lucide-react';/,
    "import { $1 } from 'lucide-react';\nimport { MagicLogo } from './MagicLogo';"
  );
}

const layoutStartStr = '{companyData.logo ? (';
const layoutEndStr = ')}';

const startIndexLayout = layoutContent.indexOf(layoutStartStr);
const endIndexLayout = layoutContent.indexOf(layoutEndStr, startIndexLayout);

if (startIndexLayout !== -1 && endIndexLayout !== -1) {
  const replacement = `<div className="w-full h-full flex flex-col items-center justify-center pt-2 pb-4">
            <MagicLogo />
          </div>`;
  layoutContent = layoutContent.substring(0, startIndexLayout) + replacement + layoutContent.substring(endIndexLayout + layoutEndStr.length);
}

fs.writeFileSync('components/Layout.tsx', layoutContent);

// -- 2. Fix Login.tsx --
let loginContent = fs.readFileSync('pages/Login.tsx', 'utf8');

if (!loginContent.includes('import { MagicLogo }')) {
  loginContent = loginContent.replace(
    /import {([^}]+)} from 'lucide-react';/,
    "import { $1 } from 'lucide-react';\nimport { MagicLogo } from '../components/MagicLogo';"
  );
}

const loginTargetTarget1 = `{displayLogo ? (
    <div className="mb-4">
      <img src={displayLogo} alt="Logo" className="w-full max-w-[280px] object-contain drop-shadow-2xl mx-auto" referrerPolicy="no-referrer" />
    </div>
  ) : (
    <div className="h-28"></div>
  )}`;

if (loginContent.includes(loginTargetTarget1)) {
  loginContent = loginContent.replace(loginTargetTarget1, `<div className="mb-10"><MagicLogo scale={1.2} /></div>`);
}

fs.writeFileSync('pages/Login.tsx', loginContent);
console.log('Layout.tsx and Login.tsx have been refactored to use native MagicLogo!');
