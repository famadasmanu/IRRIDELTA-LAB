import React, { useState, useRef } from 'react';
import { User, Users, Bell, Shield, Palette, Save, Check, Building2, ChevronRight, LogOut, Image as ImageIcon, Store, FileText, DollarSign as Currency, Globe, Ruler, Lock, Fingerprint, HelpCircle, MapPin, Edit2, Settings, Pencil, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocalConfig } from '../hooks/useLocalConfig';

import { useCompanyConfig } from '../hooks/useCompanyConfig';

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('menu');
  const [showToast, setShowToast] = useState(false);
  const [profileData, setProfileData] = useLocalConfig('config_profile', {
    nombre: 'Juan Pérez',
    email: 'juan@estudio.com',
    telefono: '+54 11 1234-5678',
    empresa: 'Argent Software',
    rol: 'Administrador',
    avatar: ''
  });

  const [companyData, setCompanyData] = useCompanyConfig();

 const [preferences, setPreferences] = useLocalConfig('config_preferences', {
 currency: 'ARS',
 language: 'Español',
 units: 'Metric',
 dateFormat: 'DD/MM/YYYY'
 });

 const [isDragging, setIsDragging] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [logoError, setLogoError] = useState<string | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const [isDraggingProfile, setIsDraggingProfile] = useState(false);
 const [isUploadingProfile, setIsUploadingProfile] = useState(false);
 const [profileError, setProfileError] = useState<string | null>(null);
 const profileInputRef = useRef<HTMLInputElement>(null);

 const handleProfileFile = (file: File) => {
 setProfileError(null);
 const validTypes = ['image/jpeg', 'image/png'];
 if (!validTypes.includes(file.type)) {
 setProfileError('Formato no válido. Usa PNG o JPG.');
 return;
 }
 if (file.size > 2 * 1024 * 1024) {
 setProfileError('El archivo supera el límite de 2MB.');
 return;
 }

 setIsUploadingProfile(true);
 const reader = new FileReader();
 reader.onloadend = () => {
 setProfileData({ ...profileData, avatar: reader.result as string });
 setIsUploadingProfile(false);
 };
 reader.readAsDataURL(file);
 };

 const onProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 handleProfileFile(e.target.files[0]);
 }
 };

 const onProfileDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDraggingProfile(true);
 };

 const onProfileDragLeave = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDraggingProfile(false);
 };

 const onProfileDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDraggingProfile(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 handleProfileFile(e.dataTransfer.files[0]);
 }
 };

 const handleFile = (file: File) => {
 setLogoError(null);
 const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
 if (!validTypes.includes(file.type)) {
 setLogoError('Formato no válido. Usa PNG, JPG o SVG.');
 return;
 }
 if (file.size > 2 * 1024 * 1024) {
 setLogoError('El archivo supera el límite de 2MB.');
 return;
 }

 setIsUploading(true);
 const reader = new FileReader();
 reader.onloadend = () => {
 setCompanyData({ ...companyData, logo: reader.result as string });
 setIsUploading(false);
 };
 reader.readAsDataURL(file);
 };

 const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 handleFile(e.target.files[0]);
 }
 };

 const onDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(true);
 };

 const onDragLeave = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 };

 const onDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 handleFile(e.dataTransfer.files[0]);
 }
 };

 const handleSave = (e: React.FormEvent) => {
 e.preventDefault();
 // the useLocalConfig hook automatically commits to localStorage on setState
 setShowToast(true);
 setTimeout(() => setShowToast(false), 3000);
 };

 return (
 <div className="space-y-6 max-w-4xl relative">
 {/* Toast Notification */}
 {showToast && (
 <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
 <div className="bg-accent rounded-full p-1">
 <Check size={16} className="text-white" />
 </div>
 <span className="font-medium">Cambios guardados correctamente</span>
 </div>
 )}

 <h1 className="text-2xl md:text-3xl font-bold text-tx-primary">Configuración General</h1>

 <div className="bg-card rounded-2xl shadow-sm border border-bd-lines overflow-hidden">
 <div className="flex flex-col md:flex-row min-h-[600px]">
 {/* Settings Sidebar / Main Menu (Mobile) */}
 <div className={cn(
 "w-full md:w-80 bg-main border-r border-bd-lines flex-col",
 activeTab === 'menu' ? "flex" : "hidden md:flex"
 )}>
 <div className="p-6 pb-2 flex flex-col items-center justify-center text-center border-b border-bd-lines">
 <div className="relative mb-4">
 <div
 className="w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold shadow-sm border-4 border-bd-lines bg-cover bg-center overflow-hidden"
 style={profileData.avatar ? { backgroundImage: `url('${profileData.avatar}')` } : {}}
 >
 {!profileData.avatar && profileData.nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
 </div>
 <button
 onClick={() => setActiveTab('perfil')}
 className="absolute bottom-0 right-0 bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-main"
 >
 <User size={14} />
 </button>
 </div>
 <h2 className="text-xl font-bold text-tx-primary">{profileData.nombre}</h2>
 <p className="text-tx-secondary text-sm mb-4">{profileData.rol}</p>
 <button
 onClick={() => setActiveTab('perfil')}
 className="w-full bg-slate-800/20 backdrop-blur-md border border-bd-lines text-tx-primary hover:border-accent hover:text-accent font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm"
 >
 Editar Perfil
 </button>
 </div>

 <div className="flex-1 overflow-y-auto">
 {/* Empresa Section */}
 <div className="px-4 py-4">
 <h3 className="text-xs font-bold text-tx-secondary uppercase tracking-wider mb-3 pl-2">Empresa</h3>
 <div className="flex flex-col gap-1">
 <button onClick={() => setActiveTab('empresa')} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-main transition-colors group">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
 <Building2 size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-semibold text-tx-primary">Empresa & Branding</p>
 <p className="text-xs text-tx-secondary">Identidad y datos comerciales</p>
 </div>
 </div>
 <ChevronRight size={20} className="text-tx-secondary group-hover:text-accent transition-colors" />
 </button>
 </div>
 </div>

 <div className="h-2 bg-main w-full"></div>

 {/* Preferencias Section */}
 <div className="px-4 py-4">
 <h3 className="text-xs font-bold text-tx-secondary uppercase tracking-wider mb-3 pl-2">Preferencias del Sistema</h3>
 <div className="flex flex-col gap-1">
 <button onClick={() => setActiveTab('preferencias')} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-main transition-colors group">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
 <Settings size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-semibold text-tx-primary">Configuración General</p>
 <p className="text-xs text-tx-secondary">Idioma: {preferences.language} · Moneda: {preferences.currency} · Unidades: {preferences.units === 'Metric' ? 'Métrico' : 'Imperial'}</p>
 </div>
 </div>
 <ChevronRight size={20} className="text-tx-secondary group-hover:text-accent transition-colors" />
 </button>
 </div>
 </div>

 <div className="h-2 bg-main w-full"></div>

 {/* Seguridad Section */}
 <div className="px-4 py-4">
 <h3 className="text-xs font-bold text-tx-secondary uppercase tracking-wider mb-3 pl-2">Seguridad</h3>
 <div className="flex flex-col gap-1">
 <div className="flex items-center justify-between w-full p-3 rounded-xl bg-card">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
 <Lock size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-semibold text-tx-primary">PIN de Acceso</p>
 <p className="text-xs text-tx-secondary">Protección adicional</p>
 </div>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" defaultChecked />
 <div className="w-11 h-6 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-bd-lines after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
 </label>
 </div>
 <div className="flex items-center justify-between w-full p-3 rounded-xl bg-card">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
 <Fingerprint size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-semibold text-tx-primary">Biometría</p>
 <p className="text-xs text-tx-secondary">Face ID / Touch ID</p>
 </div>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" />
 <div className="w-11 h-6 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-bd-lines after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
 </label>
 </div>
 </div>
 </div>

 <div className="h-2 bg-main w-full"></div>

 {/* Entorno Section */}
 <div className="px-4 py-4">
 <h3 className="text-xs font-bold text-tx-secondary uppercase tracking-wider mb-3 pl-2">Entorno</h3>
 <div className="flex flex-col gap-1">
 <button onClick={() => setActiveTab('roles')} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-main transition-colors group">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
 <Users size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-semibold text-tx-primary">Simular Vista por Rol</p>
 <p className="text-xs text-tx-secondary">Instalador, Profesional, etc.</p>
 </div>
 </div>
 <ChevronRight size={20} className="text-tx-secondary group-hover:text-accent transition-colors" />
 </button>
 </div>
 </div>

 <div className="h-2 bg-main w-full"></div>

 {/* Soporte Section */}
 <div className="px-4 py-4">
 <h3 className="text-xs font-bold text-tx-secondary uppercase tracking-wider mb-3 pl-2">Soporte</h3>
 <div className="flex flex-col gap-1">
 <button className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-main transition-colors group">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
 <HelpCircle size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-semibold text-tx-primary">Ayuda y Soporte</p>
 </div>
 </div>
 <ChevronRight size={20} className="text-tx-secondary group-hover:text-accent transition-colors" />
 </button>
 </div>
 </div>

 <div className="p-6 mt-4">
 <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 hover:text-red-300 transition-all shadow-sm">
 <LogOut size={20} />
 Cerrar Sesión
 </button>
 <p className="text-center text-xs text-tx-secondary mt-4">Versión 2.0.1 (Build 345)</p>
 </div>
 </div>
 </div>

 {/* Settings Content */}
 <div className={cn(
 "flex-1 p-6 md:p-8 bg-card",
 activeTab === 'menu' ? "hidden md:block" : "block"
 )}>
 {/* Mobile Back Button */}
 <button
 onClick={() => setActiveTab('menu')}
 className="md:hidden flex items-center gap-2 text-tx-secondary mb-6 hover:text-accent"
 >
 <ChevronRight size={20} className="rotate-180" /> Volver al menú
 </button>

 {activeTab === 'menu' && (
 <div className="hidden md:flex h-full items-center justify-center text-tx-secondary flex-col gap-4">
 <Settings size={48} className="opacity-20" />
 <p>Selecciona una opción del menú para configurar</p>
 </div>
 )}

 {activeTab === 'perfil' && (
 <form onSubmit={handleSave} className="max-w-2xl relative pb-24">
 <h2 className="text-2xl font-bold text-tx-primary mb-6">Perfil de Usuario</h2>

 {/* Profile Picture Section */}
 <section className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-accent">Foto de Perfil</h3>
 <div
 className={cn(
 "flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 border rounded-2xl transition-colors",
 isDraggingProfile ? "border-accent bg-accent/10" : "border-bd-lines bg-accent/5"
 )}
 onDragOver={onProfileDragOver}
 onDragLeave={onProfileDragLeave}
 onDrop={onProfileDrop}
 >
 <div className="relative shrink-0">
 <div
 className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-accent/30 bg-cover bg-center"
 style={profileData.avatar ? { backgroundImage: `url('${profileData.avatar}')` } : {}}
 >
 {!profileData.avatar && <User size={32} className="text-accent/40" />}
 {isUploadingProfile && (
 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
 <span className="text-white text-xs font-medium">Cargando...</span>
 </div>
 )}
 </div>
 <button
 type="button"
 onClick={() => profileInputRef.current?.click()}
 className="absolute -bottom-2 -right-2 bg-accent text-white p-2 rounded-full shadow-lg hover:brightness-90 hover:bg-accent transition-colors"
 >
 <Pencil size={14} />
 </button>
 </div>
 <div className="flex flex-col gap-1">
 <p className="font-bold text-base text-tx-primary">Foto de Perfil</p>
 <p className="text-sm text-tx-secondary">PNG o JPG. Máx 2MB.</p>
 {profileError && <p className="text-xs text-red-500 font-medium mt-1">{profileError}</p>}
 <input
 type="file"
 ref={profileInputRef}
 onChange={onProfileFileChange}
 accept="image/png, image/jpeg"
 className="hidden"
 />
 <button
 type="button"
 onClick={() => profileInputRef.current?.click()}
 className="mt-2 flex items-center justify-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:brightness-90 hover:bg-accent transition-colors w-fit shadow-sm"
 disabled={isUploadingProfile}
 >
 <Upload size={16} />
 {isUploadingProfile ? 'Subiendo...' : 'Subir Nueva'}
 </button>
 </div>
 </div>
 </section>

 {/* Personal Information Section */}
 <section className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-accent">Información Personal</h3>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">Nombre Completo</label>
 <input
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-tx-primary"
 type="text"
 value={profileData.nombre}
 onChange={e => setProfileData({ ...profileData, nombre: e.target.value })}
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">Correo Electrónico</label>
 <input
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-tx-primary"
 type="email"
 value={profileData.email}
 onChange={e => setProfileData({ ...profileData, email: e.target.value })}
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">Teléfono</label>
 <input
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-tx-primary"
 type="tel"
 value={profileData.telefono}
 onChange={e => setProfileData({ ...profileData, telefono: e.target.value })}
 />
 </div>
 </div>
 </section>

 {/* Save Action (Sticky Bottom) */}
 <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-white via-white to-transparent z-10">
 <button type="submit" className="w-full bg-accent text-white py-3.5 rounded-xl font-bold shadow-lg shadow-accent/20 hover:brightness-90 hover:bg-accent active:scale-[0.98] transition-all flex items-center justify-center gap-2">
 <Save size={20} />
 Guardar Cambios
 </button>
 </div>
 </form>
 )}

 {activeTab === 'empresa' && (
 <form onSubmit={handleSave} className="max-w-2xl relative pb-24">
 <h2 className="text-2xl font-bold text-tx-primary mb-6">Configuración de Empresa</h2>

 {/* Branding Section */}
 <section className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-accent">Marca (Branding)</h3>
 <div
 className={cn(
 "flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 border rounded-2xl transition-colors",
 isDragging ? "border-accent bg-accent/10" : "border-bd-lines bg-accent/5"
 )}
 onDragOver={onDragOver}
 onDragLeave={onDragLeave}
 onDrop={onDrop}
 >
 <div className="relative shrink-0">
 <div
 className="w-24 h-24 rounded-xl bg-accent/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-accent/30 bg-cover bg-center"
 style={companyData.logo ? { backgroundImage: `url('${companyData.logo}')` } : {}}
 >
 {!companyData.logo && <Building2 size={32} className="text-accent/40" />}
 {isUploading && (
 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
 <span className="text-white text-xs font-medium">Cargando...</span>
 </div>
 )}
 </div>
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="absolute -bottom-2 -right-2 bg-accent text-white p-2 rounded-full shadow-lg hover:brightness-90 hover:bg-accent transition-colors"
 >
 <Pencil size={14} />
 </button>
 </div>
 <div className="flex flex-col gap-1">
 <p className="font-bold text-base text-tx-primary">Logo de la Empresa</p>
 <p className="text-sm text-tx-secondary">PNG, JPG o SVG. Máx 2MB.</p>
 {logoError && <p className="text-xs text-red-500 font-medium mt-1">{logoError}</p>}
 <input
 type="file"
 ref={fileInputRef}
 onChange={onFileChange}
 accept="image/png, image/jpeg, image/svg+xml"
 className="hidden"
 />
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="mt-2 flex items-center justify-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:brightness-90 hover:bg-accent transition-colors w-fit shadow-sm"
 disabled={isUploading}
 >
 <Upload size={16} />
 {isUploading ? 'Subiendo...' : 'Subir Nuevo'}
 </button>
 </div>
 </div>
 
 <div className="mt-4 flex items-center justify-between p-4 border border-bd-lines rounded-xl bg-card">
 <div>
 <h4 className="font-medium text-tx-primary">Logo en el Dashboard</h4>
 <p className="text-sm text-tx-secondary">Mostrar logo en la pantalla de inicio</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input 
 type="checkbox" 
 className="sr-only peer" 
 checked={companyData.showLogoInDashboard !== false} 
 onChange={(e) => setCompanyData({ ...companyData, showLogoInDashboard: e.target.checked })} 
 />
 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-bd-lines after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
 </label>
 </div>
 </section>

 {/* Business Information Section */}
 <section className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-accent">Información Comercial</h3>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">Nombre del Negocio</label>
 <input
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-tx-primary"
 type="text"
 value={companyData.nombre}
 onChange={e => setCompanyData({ ...companyData, nombre: e.target.value })}
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">CUIT / ID Fiscal</label>
 <input
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-tx-primary"
 placeholder="30-71234567-9"
 type="text"
 value={companyData.cuit}
 onChange={e => setCompanyData({ ...companyData, cuit: e.target.value })}
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">Teléfono Comercial</label>
 <input
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-tx-primary"
 placeholder="+54 11 4567-8900"
 type="tel"
 defaultValue="+54 11 4567-8900"
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">Dirección Fiscal</label>
 <input
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-tx-primary"
 placeholder="Av. Libertador 1234, CABA"
 type="text"
 value={companyData.direccion}
 onChange={e => setCompanyData({ ...companyData, direccion: e.target.value })}
 />
 </div>
 </div>
 </section>

 {/* AI Integration Section */}
 <section className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-accent">Integraciones Asistente IA</h3>
 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">Google Gemini API Key</label>
 <p className="text-xs text-tx-secondary mb-3">Tu clave global para lectura de PDFs y predicciones. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-accent hover:underline">Consíguela gratis aquí</a>.</p>
 <input
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-tx-primary"
 placeholder="AIzaSy..."
 type="password"
 value={companyData.geminiApiKey}
 onChange={e => setCompanyData({ ...companyData, geminiApiKey: e.target.value })}
 />
 </div>
 </section>

 {/* Legal Terms Section */}
 <section className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-accent">Términos Legales</h3>
 <div>
 <label className="block text-sm font-semibold text-tx-secondary mb-1.5">Términos y Condiciones Predeterminados</label>
 <p className="text-xs text-tx-secondary mb-3">Estos términos se adjuntarán automáticamente a todos los nuevos presupuestos.</p>
 <textarea
 className="w-full px-4 py-3 rounded-xl border border-bd-lines bg-card focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-none text-tx-primary"
 placeholder="Ingresa los términos de servicio, métodos de pago e información de garantía..."
 rows={6}
 value={companyData.terminos}
 onChange={e => setCompanyData({ ...companyData, terminos: e.target.value })}
 />
 </div>
 </section>

 {/* Save Action (Sticky Bottom) */}
 <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-white via-white to-transparent z-10">
 <button type="submit" className="w-full bg-accent text-white py-3.5 rounded-xl font-bold shadow-lg shadow-accent/20 hover:brightness-90 hover:bg-accent active:scale-[0.98] transition-all flex items-center justify-center gap-2">
 <Save size={20} />
 Guardar Cambios
 </button>
 </div>
 </form>
 )}

 {activeTab === 'preferencias' && (
 <form onSubmit={handleSave} className="max-w-2xl relative pb-24">
 <h2 className="text-2xl font-bold text-tx-primary mb-6">Preferencias del Sistema</h2>

 {/* Currency Section */}
 <section className="mb-8">
 <h3 className="text-sm font-bold uppercase tracking-wider text-tx-secondary px-1 mb-3">Moneda</h3>
 <div className="flex flex-col gap-2">
 <RadioOption
 name="currency"
 value="ARS"
 title="ARS ($)"
 subtitle="Peso Argentino"
 checked={preferences.currency === 'ARS'}
 onChange={() => setPreferences({ ...preferences, currency: 'ARS' })}
 />
 <RadioOption
 name="currency"
 value="USD"
 title="USD ($)"
 subtitle="Dólar Estadounidense"
 checked={preferences.currency === 'USD'}
 onChange={() => setPreferences({ ...preferences, currency: 'USD' })}
 />
 <RadioOption
 name="currency"
 value="EUR"
 title="EUR (€)"
 subtitle="Euro"
 checked={preferences.currency === 'EUR'}
 onChange={() => setPreferences({ ...preferences, currency: 'EUR' })}
 />
 </div>
 </section>

 {/* Language Section */}
 <section className="mb-8">
 <h3 className="text-sm font-bold uppercase tracking-wider text-tx-secondary px-1 mb-3">Idioma</h3>
 <div className="flex flex-col gap-2">
 <RadioOption
 name="language"
 value="Español"
 title="Español"
 checked={preferences.language === 'Español'}
 onChange={() => setPreferences({ ...preferences, language: 'Español' })}
 />
 <RadioOption
 name="language"
 value="English"
 title="English"
 checked={preferences.language === 'English'}
 onChange={() => setPreferences({ ...preferences, language: 'English' })}
 />
 </div>
 </section>

 {/* Units of Measure Section */}
 <section className="mb-8">
 <h3 className="text-sm font-bold uppercase tracking-wider text-tx-secondary px-1 mb-3">Unidades de Medida</h3>
 <div className="flex flex-col gap-2">
 <RadioOption
 name="units"
 value="Metric"
 title="Métrico"
 subtitle="m, kg, °C"
 checked={preferences.units === 'Metric'}
 onChange={() => setPreferences({ ...preferences, units: 'Metric' })}
 />
 <RadioOption
 name="units"
 value="Imperial"
 title="Imperial"
 subtitle="ft, lb, °F"
 checked={preferences.units === 'Imperial'}
 onChange={() => setPreferences({ ...preferences, units: 'Imperial' })}
 />
 </div>
 </section>

 {/* Date Format Section */}
 <section className="mb-8">
 <h3 className="text-sm font-bold uppercase tracking-wider text-tx-secondary px-1 mb-3">Formato de Fecha</h3>
 <div className="flex flex-col gap-2">
 <RadioOption
 name="dateformat"
 value="DD/MM/YYYY"
 title="DD/MM/YYYY"
 checked={preferences.dateFormat === 'DD/MM/YYYY'}
 onChange={() => setPreferences({ ...preferences, dateFormat: 'DD/MM/YYYY' })}
 />
 <RadioOption
 name="dateformat"
 value="MM/DD/YYYY"
 title="MM/DD/YYYY"
 checked={preferences.dateFormat === 'MM/DD/YYYY'}
 onChange={() => setPreferences({ ...preferences, dateFormat: 'MM/DD/YYYY' })}
 />
 <RadioOption
 name="dateformat"
 value="YYYY-MM-DD"
 title="YYYY-MM-DD"
 checked={preferences.dateFormat === 'YYYY-MM-DD'}
 onChange={() => setPreferences({ ...preferences, dateFormat: 'YYYY-MM-DD' })}
 />
 </div>
 </section>

 {/* Save Action (Sticky Bottom) */}
 <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-white via-white to-transparent z-10">
 <button type="submit" className="w-full bg-accent text-white py-3.5 rounded-xl font-bold shadow-lg shadow-accent/20 hover:brightness-90 hover:bg-accent active:scale-[0.98] transition-all flex items-center justify-center gap-2">
 <Save size={20} />
 Guardar Cambios
 </button>
 </div>
 </form>
  )}

  {activeTab === 'roles' && (
  <div className="max-w-2xl relative pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-2xl font-bold text-tx-primary mb-6">Simulador de Entorno por Roles</h2>
    <p className="text-tx-secondary text-sm mb-8 bg-accent/5 p-4 rounded-xl border border-accent/20">
      Al cambiar de rol, la plataforma se adapta automáticamente mostrando <strong>solo los módulos y herramientas</strong> que cada tipo de usuario necesita en su día a día.
    </p>

    <div className="space-y-4">
      {[
        { id: 'desarrollador', title: 'Desarrollador / Root', desc: 'Acceso absoluto a la matriz. Monitoreo global, APIs (Hydrawise) y salud del sistema.' },
        { id: 'irridelta', title: 'Argent Software (Empresa / Dueños)', desc: 'Control de rentabilidad, stock, reportes financieros y gestión de ecosistemas de clientes.' },
        { id: 'profesional', title: 'El Profesional (Arquitecto / Ventas)', desc: 'Herramientas de diseño. Calculadora Hidráulica, dibujo de planos y exportación a PDF.' },
        { id: 'instalador', title: 'El Instalador (Personal de Campo)', desc: 'Vista 100% móvil. Rutas directas a obra firmando remitos simples y agenda del día.' }
      ].map(role => {
        const currentRole = window.localStorage.getItem('user_role')?.replace(/"/g, '') || 'admin';
        const isActive = currentRole === role.id || (role.id === 'desarrollador' && currentRole === 'admin');
        
        return (
          <button 
            key={role.id}
            type="button"
            onClick={() => {
              window.localStorage.setItem('user_role', JSON.stringify(role.id));
              window.location.reload();
            }}
            className={cn("w-full text-left p-5 rounded-xl border transition-all group flex flex-col gap-2 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-card", isActive ? 'border-accent bg-accent/5 shadow-md shadow-accent/10' : 'border-bd-lines bg-card hover:border-accent/50 hover:shadow-lg')}
          >
            {isActive && <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>}
            <div className="flex justify-between items-center w-full">
              <h3 className={cn("font-bold text-lg", isActive ? "text-accent" : "text-tx-primary group-hover:text-accent")}>{role.title}</h3>
              {isActive && (
                <span className="bg-accent text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-sm">Entorno Activo</span>
              )}
            </div>
            <p className="text-sm text-tx-secondary leading-relaxed max-w-lg">{role.desc}</p>
          </button>
        )
      })}
    </div>
  </div>
  )}

 {activeTab === 'notificaciones' && (
 <form onSubmit={handleSave} className="space-y-6">
 <h2 className="text-xl font-bold text-tx-primary mb-6">Preferencias de Notificaciones</h2>
 <div className="space-y-4">
 {[
 { title: 'Notificaciones Push', desc: 'Recibir alertas en el navegador' },
 { title: 'Correos Electrónicos', desc: 'Resumen diario de actividades' },
 { title: 'Alertas de Stock', desc: 'Avisar cuando un material está bajo' },
 ].map((item, i) => (
 <div key={i} className="flex items-center justify-between p-4 border border-bd-lines rounded-xl">
 <div>
 <h4 className="font-medium text-tx-primary">{item.title}</h4>
 <p className="text-sm text-tx-secondary">{item.desc}</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" defaultChecked={i !== 1} />
 <div className="w-11 h-6 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-bd-lines after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
 </label>
 </div>
 ))}
 </div>
 <div className="pt-6 border-t border-bd-lines flex justify-end">
 <button type="submit" className="bg-accent text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:brightness-90 hover:bg-accent transition-colors font-medium">
 <Save size={18} />
 Guardar Preferencias
 </button>
 </div>
 </form>
 )}

 {activeTab === 'seguridad' && (
 <form onSubmit={handleSave} className="space-y-6">
 <h2 className="text-xl font-bold text-tx-primary mb-6">Seguridad de la Cuenta</h2>
 <div className="space-y-4 max-w-md">
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Contraseña Actual</label>
 <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Nueva Contraseña</label>
 <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
 </div>
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Confirmar Nueva Contraseña</label>
 <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" />
 </div>
 </div>
 <div className="pt-6 border-t border-bd-lines flex justify-start">
 <button type="submit" className="bg-accent text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:brightness-90 hover:bg-accent transition-colors font-medium">
 <Save size={18} />
 Actualizar Contraseña
 </button>
 </div>
 </form>
 )}

 {activeTab === 'apariencia' && (
 <div className="space-y-6">
 <h2 className="text-xl font-bold text-tx-primary mb-6">Apariencia</h2>
 <div className="grid grid-cols-2 gap-4 max-w-md">
 <button className="border-2 border-accent bg-main p-4 rounded-xl flex flex-col items-center gap-2">
 <div className="w-12 h-12 rounded-full bg-card shadow-sm border border-bd-lines flex items-center justify-center">
 <div className="w-6 h-6 rounded-full bg-gray-800"></div>
 </div>
 <span className="font-medium text-tx-primary">Modo Claro</span>
 </button>
 <button className="border-2 border-transparent bg-main p-4 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
 <div className="w-12 h-12 rounded-full bg-gray-800 shadow-sm border border-gray-700 flex items-center justify-center">
 <div className="w-6 h-6 rounded-full bg-card"></div>
 </div>
 <span className="font-medium text-tx-primary">Modo Oscuro</span>
 <span className="text-xs text-tx-secondary">(Próximamente)</span>
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}

function RadioOption({ name, value, title, subtitle, checked, onChange }: { name: string, value: string, title: string, subtitle?: string, checked: boolean, onChange: () => void }) {
 return (
 <label className="group flex items-center justify-between gap-4 rounded-xl border border-bd-lines p-4 cursor-pointer hover:border-accent/50 transition-all active:scale-[0.98] bg-card">
 <div className="flex flex-col">
 <p className="text-tx-primary text-sm font-semibold">{title}</p>
 {subtitle && <p className="text-tx-secondary text-xs">{subtitle}</p>}
 </div>
 <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", checked ? "border-accent" : "border-bd-lines")}>
 {checked && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
 </div>
 <input
 type="radio"
 name={name}
 value={value}
 checked={checked}
 onChange={onChange}
 className="sr-only"
 />
 </label>
 );
}
