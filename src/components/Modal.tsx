import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title: string;
 children: ReactNode;
 className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
 <div className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity" onClick={onClose} />
 <div className={cn("page-enter relative glass-card rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] z-10", className)}>
 <div className="flex items-center justify-between p-4 sm:p-6 border-b border-bd-lines">
 <h3 className="text-lg font-bold text-tx-primary">{title}</h3>
 <button onClick={onClose} className="text-tx-secondary hover:text-tx-secondary p-1 rounded-full hover:bg-main transition-colors">
 <X size={20} />
 </button>
 </div>
 <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 min-w-0 flex flex-col">
 {children}
 </div>
 </div>
 </div>
 );
}
