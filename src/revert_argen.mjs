import * as fs from 'fs';

// -- 1. Fix Layout.tsx --
let layoutContent = fs.readFileSync('components/Layout.tsx', 'utf8');

// Eliminar el import de ArgenLogo
layoutContent = layoutContent.replace(/import { ArgenLogo } from '\.\/ArgenLogo';\n/, '');

// Reemplazar el contenedor de ArgenLogo con la imagen
const layoutTarget = `<div className="w-full h-full flex flex-col items-center justify-center pt-2 pb-4">
            <ArgenLogo dark={true} scale={0.7} />
          </div>`;
          
const layoutReplacement = `{companyData.logo ? (
            <div className="w-full px-8 py-2 flex items-center justify-center mt-2 group min-h-[76px]">
              <img 
                src={companyData.logo} 
                alt={companyData.nombre} 
                className="w-full max-w-[180px] h-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover:scale-[1.03] transition-transform duration-500 ease-out" 
                referrerPolicy="no-referrer" 
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full justify-center opacity-0">
               {/* Prevenir colapso mientras carga */}
            </div>
          )}`;
          
layoutContent = layoutContent.replace(layoutTarget, layoutReplacement);
fs.writeFileSync('components/Layout.tsx', layoutContent);

// -- 2. Fix Login.tsx --
let loginContent = fs.readFileSync('pages/Login.tsx', 'utf8');

// Eliminar el import de ArgenLogo
loginContent = loginContent.replace(/import { ArgenLogo } from '\.\.\/components\/ArgenLogo';\n/, '');

const loginTargetTarget1 = `<div className="mb-10"><ArgenLogo dark={false} scale={1.2} /></div>`;
const loginTargetTarget2 = `<div className="mb-10 mt-4"><ArgenLogo dark={false} scale={1.2} /></div>`;

const loginReplacementStr = `{displayLogo ? (
    <div className="mb-4">
      <img src={displayLogo} alt="Logo" className="w-full max-w-[280px] object-contain drop-shadow-2xl mx-auto" referrerPolicy="no-referrer" />
    </div>
  ) : (
    <div className="h-28"></div>
  )}`;

if (loginContent.includes(loginTargetTarget1)) {
  loginContent = loginContent.replace(loginTargetTarget1, loginReplacementStr);
} else if (loginContent.includes(loginTargetTarget2)) {
  loginContent = loginContent.replace(loginTargetTarget2, loginReplacementStr);
}

fs.writeFileSync('pages/Login.tsx', loginContent);
console.log('Restored the native img tags to properly respect the user logo image Upload.');
