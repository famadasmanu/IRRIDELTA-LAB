const fs = require('fs');

let code = fs.readFileSync('src/pages/Personal.tsx', 'utf-8');

// The new unified header
const newHeader = `<div className={cn("relative bg-card dark:bg-card rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95 border border-transparent dark:border-bd-lines transition-all duration-300", employeeTab === 'ficha' ? "max-w-md" : "max-w-2xl")}>
            <div className="sticky top-0 z-20 flex flex-col bg-card dark:bg-main/95 backdrop-blur-md border-b border-gray-100 dark:border-bd-lines">
              <div className="p-4 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-tx-primary flex items-center gap-2">
                  <User size={18} className="text-accent dark:text-emerald-500" />
                  Expediente del Empleado
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={employeeTab === 'ficha' ? handleExportEmployeePDF : handleExportHRPDF}
                    disabled={isExporting}
                    className={cn("p-1.5 rounded transition", isExporting ? "text-gray-300 dark:text-tx-secondary" : "text-gray-500 dark:text-tx-secondary hover:text-accent dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800")}
                    title="Exportar a PDF"
                  >
                    <FileText size={18} className={isExporting ? "animate-pulse" : ""} />
                  </button>
                  <button onClick={() => setIsEmployeeDetailModalOpen(false)} className="text-gray-400 dark:text-tx-secondary p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex px-4 gap-6 bg-gray-50/50 dark:bg-main/50">
                <button 
                  onClick={() => setEmployeeTab('ficha')} 
                  className={cn("py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", employeeTab === 'ficha' ? "border-accent text-accent dark:border-emerald-500 dark:text-emerald-400" : "border-transparent text-gray-500 dark:text-tx-secondary hover:text-gray-700 dark:hover:text-tx-primary")}
                >
                  <Briefcase size={16} /> Ficha General
                </button>
                <button 
                  onClick={() => setEmployeeTab('rh')} 
                  className={cn("py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", employeeTab === 'rh' ? "border-accent text-accent dark:border-emerald-500 dark:text-emerald-400" : "border-transparent text-gray-500 dark:text-tx-secondary hover:text-gray-700 dark:hover:text-tx-primary")}
                >
                  <Activity size={16} /> Recursos Humanos
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              {employeeTab === 'ficha' ? (
                <>
                  <div className="flex items-center gap-4">`;

// Ficha search regex
const oldHeaderRegex = /<div className="relative bg-card dark:bg-card rounded-2xl w-full max-w-md max-h-\[90vh\] overflow-y-auto shadow-xl animate-in zoom-in-95 border border-transparent dark:border-bd-lines">[\s\S]*?<div className="flex items-center gap-4">/m;

code = code.replace(oldHeaderRegex, newHeader);

// End of Ficha content regex
const oldFooterRegex = /<button\s+onClick=\{\(\) => \{\s+setSelectedMember\(selectedEmployeeDetail\);\s+handleOpenEdit\(selectedEmployeeDetail\);\s+setIsEmployeeDetailModalOpen\(false\);\s+\}\}\s+className="px-4 py-2 bg-accent dark:bg-emerald-600 text-white font-medium rounded-lg hover:opacity-90 dark:hover:bg-emerald-500 transition-colors flex items-center gap-2"\s+>\s+<Edit2 size=\{16\} \/> Editar Datos\s+<\/button>\s+<\/div>\s+<\/div>/m;

// Search for HR content
const hrModalCodeRegex = /\{isHRModalOpen[\s\S]*?<div className="p-6 bg-gray-50\/30 dark:bg-main\/30 flex flex-col gap-5">\s*([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\)\}/m;

const hrMatch = code.match(hrModalCodeRegex);
let hrContent = '';
if (hrMatch && hrMatch[1]) {
   hrContent = hrMatch[1];
   code = code.replace(hrModalCodeRegex, '');
   console.log('Successfully captured HR Modal content');
} else {
   console.log('Could not find HR modal content using Regex');
   // try alternative regex
   const altRegex = /\{isHRModalOpen[\s\S]*?Gestión de RRHH[\s\S]*?<div className="p-6 bg-gray-50\/30 dark:bg-main\/30 flex flex-col gap-5">\s*([\s\S]*?)<\/div><\/div><\/div>\)\}/m;
   const match2 = code.match(altRegex);
   if (match2) {
      hrContent = match2[1];
      code = code.replace(altRegex, '');
      console.log('Found with alternative regex');
   } else {
      console.log('STILL FAILED');
   }
}

const customFooter = `                <button
                  onClick={() => {
                    setSelectedMember(selectedEmployeeDetail);
                    handleOpenEdit(selectedEmployeeDetail);
                    setIsEmployeeDetailModalOpen(false);
                  }}
                  className="px-4 py-2 bg-accent dark:bg-emerald-600 text-white font-medium rounded-lg hover:opacity-90 dark:hover:bg-emerald-500 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={16} /> Editar Datos
                </button>
              </div>
            </>
          ) : (
             <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col gap-5">
${hrContent}
             </div>
          )}
          </div>
          </div>`;

if (code.match(oldFooterRegex)) {
  code = code.replace(oldFooterRegex, customFooter);
  console.log('Replaced footer!');
} else {
  console.log('Failed to match footer regex');
}

fs.writeFileSync('src/pages/Personal.tsx', code);
console.log('Refactoring complete.');
