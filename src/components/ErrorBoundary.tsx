import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
 children?: ReactNode;
}

interface State {
 hasError: boolean;
 error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
 public state: State = {
 hasError: false
 };

 public static getDerivedStateFromError(error: Error): State {
 // Actualiza el estado para que la siguiente renderización muestre la interfaz de repuesto
 return { hasError: true, error };
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error("Uncaught error:", error, errorInfo);
 }

 private handleGoBack = () => {
 this.setState({ hasError: false });
 window.location.href = '/inicio';
 };

 public render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-main flex flex-col items-center justify-center p-4">
 <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full border border-bd-lines text-center">
 <div className="inline-flex p-4 rounded-full bg-red-50 text-red-500 mb-6 border border-red-100">
 <AlertTriangle className="w-12 h-12" />
 </div>
 <h1 className="text-2xl font-bold text-tx-primary mb-2">¡Ups! Algo salió mal</h1>
 <p className="text-tx-secondary mb-8">
 Encontramos un error inesperado al cargar esta sección. Puedes volver a intentarlo o regresar al inicio.
 </p>
 <div className="flex flex-col gap-3">
 <button
 onClick={() => window.location.reload()}
 className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-[#15803d] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
 >
 <RefreshCw className="w-5 h-5" />
 Recargar página
 </button>
 <button
 onClick={this.handleGoBack}
 className="w-full font-bold text-tx-secondary hover:text-tx-primary hover:bg-main py-3 rounded-xl transition-colors border border-transparent shadow-sm"
 >
 Volver al inicio
 </button>
 </div>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
