const fs = require('fs');
const filepath = 'c:/Users/famad/Desktop/IRRIDELTA/src/pages/Trabajos.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Remove the unused functions
content = content.replace(/const handleAddGasto = \(\) => \{[\s\S]*?setGastosDetalle\(\[\.\.\.gastosDetalle[^]*?\}\;/g, '');
content = content.replace(/const handleUpdateGasto = \([\s\S]*?\}\;/g, '');
content = content.replace(/const handleRemoveGasto = \([\s\S]*?\}\;/g, '');
content = content.replace(/const handleOpenPactadoDetail = \([\s\S]*?\}\;/g, '');

// Clean up state
content = content.replace(/const \[selectedPactado, setSelectedPactado\] = useState.*?;/, '');
content = content.replace(/const \[isPactadoDetailModalOpen, setIsPactadoDetailModalOpen\] = useState.*?;/, '');
content = content.replace(/const \[newPactadoArchivoNombre, setNewPactadoArchivoNombre\] = useState.*?;/, '');
content = content.replace(/const \[newPactadoArchivoUrl, setNewPactadoArchivoUrl\] = useState.*?;/, '');
content = content.replace(/const \[newPactadoHistorial, setNewPactadoHistorial\] = useState.*?;/, '');

// Delete handleAddPactadoArchivo
content = content.replace(/const handleAddPactadoArchivo = \(.*?\) => \{[\s\S]*?displayToast\('Archivo agregado'\);\s*\};/g, '');
// Delete handleAddPactadoHistorial
content = content.replace(/const handleAddPactadoHistorial = \(.*?\) => \{[\s\S]*?displayToast\('Suceso registrado'\);\s*\};/g, '');
// Delete handleExportPactadoPDF
content = content.replace(/const handleExportPactadoPDF = async \(\) => \{[\s\S]*?displayToast\('Error al generar el PDF del trabajo'\);\s*\} finally \{\s*setIsExporting\(false\);\s*\}\s*\};/g, '');

// Delete the Pactado Detail Modal
content = content.replace(/\{\/\* Pactado Detail Modal \*\/\}[\s\S]*?\{isPactadoDetailModalOpen &&.*?<\/div>\s*<\/div>\s*\)\}/g, '');

// 2. Re-arrange the Grid layout to put Módulos under Análisis de Rendimiento.
// Search for Nueva Linea de Estadios
const startToken = '{/* Nueva Línea de Estadios (Módulos de Obra) */}';
const endToken = '{/* Hidden PDF Template */}';
const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);

if (startIndex > -1 && endIndex > -1) {
    let modulosBlock = content.substring(startIndex, endIndex);

    // Remove the original block from file
    content = content.substring(0, startIndex) + content.substring(endIndex);

    const matchOldDoubleBlock = modulosBlock.indexOf(startToken, 10);
    if(matchOldDoubleBlock > -1){
        // In case there was double injection, just take the first part
        modulosBlock = modulosBlock.substring(0, matchOldDoubleBlock);
    }
    
    const insertPointToken = `
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3A5F4B]/5 rounded-bl-[100px] pointer-events-none"></div>`;

    let newContent = content.replace(insertPointToken, '\n              ' + modulosBlock + '\n' + insertPointToken);
    content = newContent;
}

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed buttons and layout priority.');
