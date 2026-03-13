import React, { useState, useRef, useEffect } from 'react';
import { Search, XCircle, FileText, ChevronLeft, ChevronRight, UploadCloud, Target } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { set, get } from 'idb-keyval';
import { cn } from '../lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FileData {
    id: number;
    name: string;
    type: string;
    size: string;
    date: string;
    action: string;
    tags: string[];
}

interface PDFComparatorProps {
    recentFiles: FileData[];
    setRecentFiles: (files: FileData[]) => void;
    displayToast: (msg: string) => void;
}

export const PDFComparator: React.FC<PDFComparatorProps> = ({ recentFiles, setRecentFiles, displayToast }) => {
    const fileInputRef1 = useRef<HTMLInputElement>(null);
    const fileInputRef2 = useRef<HTMLInputElement>(null);

    const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

    const [selectedOriginProduct, setSelectedOriginProduct] = useState<string>('');
    const [selectedTargetProduct, setSelectedTargetProduct] = useState<string>('');

    const [pdfSearchQuery, setPdfSearchQuery] = useState('');

    // PDF Document details
    const [doc1Summary, setDoc1Summary] = useState<{ pdf: any, numPages: number } | null>(null);
    const [doc2Summary, setDoc2Summary] = useState<{ pdf: any, numPages: number } | null>(null);

    const [pageNumber1, setPageNumber1] = useState<number>(1);
    const [pageNumber2, setPageNumber2] = useState<number>(1);

    const [matches1, setMatches1] = useState<number[]>([]);
    const [matches2, setMatches2] = useState<number[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Load offline PDFs
    useEffect(() => {
        const loadOfflinePdfs = async () => {
            const loadedUrls: Record<string, string> = {};
            for (const file of recentFiles) {
                if (file.type === 'pdf') {
                    try {
                        const buffer = await get(`pdf_${file.name}`);
                        if (buffer) {
                            const blob = new Blob([buffer], { type: 'application/pdf' });
                            loadedUrls[file.name] = URL.createObjectURL(blob);
                        }
                    } catch (e) {
                        console.error(`Failed to load PDF ${file.name} from IDB`, e);
                    }
                }
            }
            setPdfUrls(loadedUrls);
        };
        loadOfflinePdfs();
    }, [recentFiles]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 1 | 2) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const newFile = {
            id: Date.now(),
            name: file.name,
            type: file.name.split('.').pop()?.toLowerCase() || 'file',
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            date: 'Justo ahora',
            action: 'Documento PDF',
            tags: []
        };

        setRecentFiles([newFile, ...recentFiles]);
        displayToast('PDF cargado exitosamente');

        if (file.type === 'application/pdf' || newFile.name.toLowerCase().endsWith('.pdf')) {
            const newUrl = URL.createObjectURL(file);
            setPdfUrls(prev => ({ ...prev, [newFile.name]: newUrl }));
            file.arrayBuffer().then(buffer => {
                set(`pdf_${file.name}`, buffer).catch(console.error);
            });

            if (side === 1) setSelectedOriginProduct(newFile.name);
            else setSelectedTargetProduct(newFile.name);
        }
    };

    const handleDocumentLoadSuccess = (pdf: any, side: 1 | 2) => {
        if (side === 1) setDoc1Summary({ pdf, numPages: pdf.numPages });
        else setDoc2Summary({ pdf, numPages: pdf.numPages });
    };

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(pdfSearchQuery);
        }, 800);
        return () => clearTimeout(handler);
    }, [pdfSearchQuery, doc1Summary, doc2Summary]);

    const performSearch = async (query: string) => {
        if (!query || query.length < 3) {
            setMatches1([]);
            setMatches2([]);
            return;
        }

        setIsSearching(true);

        const scanPdf = async (docSummary: { pdf: any, numPages: number } | null) => {
            if (!docSummary) return [];
            const found: number[] = [];
            const { pdf, numPages } = docSummary;
            for (let i = 1; i <= numPages; i++) {
                try {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const text = textContent.items.map((item: any) => item.str).join(' ');
                    if (text.toLowerCase().includes(query.toLowerCase())) {
                        found.push(i);
                    }
                } catch (err) {
                    console.error(`Error scanning page ${i}`, err);
                }
            }
            return found;
        };

        const [res1, res2] = await Promise.all([scanPdf(doc1Summary), scanPdf(doc2Summary)]);
        setMatches1(res1);
        setMatches2(res2);

        // Auto jump to first match if present
        if (res1.length > 0) setPageNumber1(res1[0]);
        if (res2.length > 0) setPageNumber2(res2[0]);

        setIsSearching(false);
    };

    const currentPdf1Url = pdfUrls[selectedOriginProduct];
    const currentPdf2Url = pdfUrls[selectedTargetProduct];

    const highlightText = (text: string, highlight: string) => {
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return <span>{parts.map((part, i) => part.toLowerCase() === highlight.toLowerCase() ? <mark key={i}>{part}</mark> : part)}</span>;
    };

    return (
        <div className="flex flex-col gap-6">
            <input type="file" ref={fileInputRef1} className="hidden" accept=".pdf,application/pdf" onChange={e => handleFileUpload(e, 1)} />
            <input type="file" ref={fileInputRef2} className="hidden" accept=".pdf,application/pdf" onChange={e => handleFileUpload(e, 2)} />

            {/* Unified Search Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between shadow-sm w-full relative">
                <div className="flex flex-1 items-center w-full">
                    <Search className={cn("ml-2", isSearching ? "text-orange-500 animate-pulse" : "text-slate-400")} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar en ambos PDFs (ej. 'caudal', 'presión')..."
                        className="bg-transparent border-none outline-none flex-1 py-2 px-3 text-sm text-slate-700 font-medium"
                        value={pdfSearchQuery}
                        onChange={e => setPdfSearchQuery(e.target.value)}
                    />
                    {pdfSearchQuery && (
                        <button onClick={() => setPdfSearchQuery('')} className="text-slate-400 hover:text-red-500 p-1 mr-2">
                            <XCircle size={18} />
                        </button>
                    )}
                </div>

                {pdfSearchQuery.length >= 3 && !isSearching && (
                    <div className="flex gap-4 mt-2 sm:mt-0 px-4 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 text-sm font-semibold">
                        <span className={cn(matches1.length > 0 ? "text-green-600" : "text-slate-400")}>{matches1.length} en Doc 1</span>
                        <span className={cn(matches2.length > 0 ? "text-green-600" : "text-slate-400")}>{matches2.length} en Doc 2</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[70vh]">

                {/* Left Column: PDF 1 */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText className="text-red-500" size={18} /> Documento 1</h3>
                        </div>
                        <select
                            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none max-w-[200px] truncate"
                            value={selectedOriginProduct}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'upload_new') fileInputRef1.current?.click();
                                else { setSelectedOriginProduct(val); setPageNumber1(1); }
                            }}
                        >
                            <option value="">Seleccionar PDF...</option>
                            {recentFiles.filter(f => f.type === 'pdf').map(f => (
                                <option key={f.id} value={f.name}>{f.name}</option>
                            ))}
                            <option value="upload_new" className="font-bold text-[#3A5F4B]">+ Subir nuevo PDF...</option>
                        </select>
                    </div>

                    <div className="flex-1 bg-slate-100/50 rounded-xl overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start p-2 relative min-h-[400px]">
                        {currentPdf1Url ? (
                            <>
                                <Document
                                    file={currentPdf1Url}
                                    onLoadSuccess={(pdf) => handleDocumentLoadSuccess(pdf, 1)}
                                    loading={<div className="mt-20 text-slate-400 font-medium animate-pulse">Cargando PDF...</div>}
                                    className="w-full flex justify-center"
                                >
                                    <Page
                                        pageNumber={pageNumber1}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={false}
                                        width={400}
                                        customTextRenderer={({ str }) => (pdfSearchQuery && matches1.includes(pageNumber1) ? highlightText(str, pdfSearchQuery) : str) as any}
                                    />
                                </Document>
                            </>
                        ) : (
                            <div className="text-center mt-20 text-slate-400 flex flex-col items-center gap-3">
                                <FileText size={48} className="text-slate-300" />
                                <p>Seleccione o cargue un archivo PDF</p>
                                <button onClick={() => fileInputRef1.current?.click()} className="px-4 py-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50">Subir Archivo</button>
                            </div>
                        )}
                    </div>

                    {doc1Summary && (
                        <div className="flex items-center justify-between mt-4">
                            <button
                                onClick={() => setPageNumber1(Math.max(1, pageNumber1 - 1))}
                                disabled={pageNumber1 <= 1}
                                className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
                            ><ChevronLeft size={24} /></button>
                            <span className="text-sm font-semibold text-slate-600">Pág. {pageNumber1} de {doc1Summary.numPages}</span>
                            <button
                                onClick={() => setPageNumber1(Math.min(doc1Summary.numPages, pageNumber1 + 1))}
                                disabled={pageNumber1 >= doc1Summary.numPages}
                                className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
                            ><ChevronRight size={24} /></button>
                        </div>
                    )}
                </div>

                {/* Right Column: PDF 2 */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target className="text-orange-500" size={18} /> Documento 2</h3>
                        </div>
                        <select
                            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none max-w-[200px] truncate"
                            value={selectedTargetProduct}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'upload_new') fileInputRef2.current?.click();
                                else { setSelectedTargetProduct(val); setPageNumber2(1); }
                            }}
                        >
                            <option value="">Seleccionar PDF...</option>
                            {recentFiles.filter(f => f.type === 'pdf').map(f => (
                                <option key={f.id} value={f.name}>{f.name}</option>
                            ))}
                            <option value="upload_new" className="font-bold text-[#3A5F4B]">+ Subir nuevo PDF...</option>
                        </select>
                    </div>

                    <div className="flex-1 bg-slate-100/50 rounded-xl overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start p-2 relative min-h-[400px]">
                        {currentPdf2Url ? (
                            <>
                                <Document
                                    file={currentPdf2Url}
                                    onLoadSuccess={(pdf) => handleDocumentLoadSuccess(pdf, 2)}
                                    loading={<div className="mt-20 text-slate-400 font-medium animate-pulse">Cargando PDF...</div>}
                                    className="w-full flex justify-center"
                                >
                                    <Page
                                        pageNumber={pageNumber2}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={false}
                                        width={400}
                                        customTextRenderer={({ str }) => (pdfSearchQuery && matches2.includes(pageNumber2) ? highlightText(str, pdfSearchQuery) : str) as any}
                                    />
                                </Document>
                            </>
                        ) : (
                            <div className="text-center mt-20 text-slate-400 flex flex-col items-center gap-3">
                                <Target size={48} className="text-slate-300" />
                                <p>Seleccione o cargue para comparar</p>
                                <button onClick={() => fileInputRef2.current?.click()} className="px-4 py-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50">Subir Archivo</button>
                            </div>
                        )}
                    </div>

                    {doc2Summary && (
                        <div className="flex items-center justify-between mt-4">
                            <button
                                onClick={() => setPageNumber2(Math.max(1, pageNumber2 - 1))}
                                disabled={pageNumber2 <= 1}
                                className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
                            ><ChevronLeft size={24} /></button>
                            <span className="text-sm font-semibold text-slate-600">Pág. {pageNumber2} de {doc2Summary.numPages}</span>
                            <button
                                onClick={() => setPageNumber2(Math.min(doc2Summary.numPages, pageNumber2 + 1))}
                                disabled={pageNumber2 >= doc2Summary.numPages}
                                className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-50"
                            ><ChevronRight size={24} /></button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
