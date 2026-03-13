import React, { useState, useRef } from 'react';
import { User, Bell, Shield, Palette, Save, Check, Building2, ChevronRight, LogOut, Image as ImageIcon, Store, FileText, DollarSign as Currency, Globe, Ruler, Lock, Fingerprint, HelpCircle, MapPin, Edit2, Settings, Pencil, Upload } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('menu');
  const [showToast, setShowToast] = useState(false);

  const [profileData, setProfileData] = useLocalStorage('config_profile', {
    nombre: 'Juan Pérez',
    email: 'juan@estudio.com',
    telefono: '+54 11 1234-5678',
    empresa: 'GreenFields Landscapes',
    rol: 'Administrador',
    avatar: ''
  });

  const [companyData, setCompanyData] = useLocalStorage('config_company', {
    nombre: 'GreenFields Landscapes',
    cuit: '30-12345678-9',
    direccion: 'Av. Libertador 1234, CABA',
    terminos: 'El presupuesto tiene una validez de 15 días. Pago del 50% por adelantado.',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASkzUC9DNQrHglh2e6G7kg1CWectkzqVhy57Hmk5Y_xJ8h8Bx7GvT1k4Ly9_iy6dcXfpdIZQESlcPmdQKYj5YVSpvkKqmr_Vcuhdt0fKCfuqVjWxo_u4lnNkOhd2GWjVo9vAFHN1Kd03Kh0orAXNaQdZKMtek2kD1DzV1TChRTd3FyAjK1cTCGRn0-aX9LEmkINiHbPuecU-qOFxiU54SNvsbVAuLBX5H32OR8MoubDtTpE2E4NdLS3ZN6bCr4ZlxdCNOiztCVBLM'
  });

  const [preferences, setPreferences] = useLocalStorage('config_preferences', {
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
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
          <div className="bg-green-500 rounded-full p-1">
            <Check size={16} className="text-white" />
          </div>
          <span className="font-medium">Cambios guardados correctamente</span>
        </div>
      )}

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Configuración General</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Settings Sidebar / Main Menu (Mobile) */}
          <div className={cn(
            "w-full md:w-80 bg-gray-50 border-r border-[#3A5F4B]/10 flex-col",
            activeTab === 'menu' ? "flex" : "hidden md:flex"
          )}>
            <div className="p-6 pb-2 flex flex-col items-center justify-center text-center border-b border-gray-200">
              <div className="relative mb-4">
                <div
                  className="w-24 h-24 rounded-full bg-[#3A5F4B] text-white flex items-center justify-center text-3xl font-bold shadow-sm border-4 border-[#eef2f0] bg-cover bg-center overflow-hidden"
                  style={profileData.avatar ? { backgroundImage: `url('${profileData.avatar}')` } : {}}
                >
                  {!profileData.avatar && profileData.nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={() => setActiveTab('perfil')}
                  className="absolute bottom-0 right-0 bg-[#3A5F4B] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white"
                >
                  <User size={14} />
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profileData.nombre}</h2>
              <p className="text-gray-500 text-sm mb-4">{profileData.rol}</p>
              <button
                onClick={() => setActiveTab('perfil')}
                className="w-full bg-[#eef2f0] text-[#3A5F4B] font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors hover:bg-[#3A5F4B]/20"
              >
                Editar Perfil
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Empresa Section */}
              <div className="px-4 py-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pl-2">Empresa</h3>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setActiveTab('empresa')} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Building2 size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Empresa & Branding</p>
                        <p className="text-xs text-gray-500">Identidad y datos comerciales</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-[#3A5F4B] transition-colors" />
                  </button>
                </div>
              </div>

              <div className="h-2 bg-gray-100 w-full"></div>

              {/* Preferencias Section */}
              <div className="px-4 py-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pl-2">Preferencias del Sistema</h3>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setActiveTab('preferencias')} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Settings size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Configuración General</p>
                        <p className="text-xs text-gray-500">Idioma: {preferences.language} · Moneda: {preferences.currency} · Unidades: {preferences.units === 'Metric' ? 'Métrico' : 'Imperial'}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-[#3A5F4B] transition-colors" />
                  </button>
                </div>
              </div>

              <div className="h-2 bg-gray-100 w-full"></div>

              {/* Seguridad Section */}
              <div className="px-4 py-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pl-2">Seguridad</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between w-full p-3 rounded-xl bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Lock size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">PIN de Acceso</p>
                        <p className="text-xs text-gray-500">Protección adicional</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A5F4B]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between w-full p-3 rounded-xl bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Fingerprint size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Biometría</p>
                        <p className="text-xs text-gray-500">Face ID / Touch ID</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A5F4B]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="h-2 bg-gray-100 w-full"></div>

              {/* Soporte Section */}
              <div className="px-4 py-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pl-2">Soporte</h3>
                <div className="flex flex-col gap-1">
                  <button className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <HelpCircle size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Ayuda y Soporte</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-[#3A5F4B] transition-colors" />
                  </button>
                </div>
              </div>

              <div className="p-6 mt-4">
                <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all">
                  <LogOut size={20} />
                  Cerrar Sesión
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">Versión 2.0.1 (Build 345)</p>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className={cn(
            "flex-1 p-6 md:p-8 bg-white",
            activeTab === 'menu' ? "hidden md:block" : "block"
          )}>
            {/* Mobile Back Button */}
            <button
              onClick={() => setActiveTab('menu')}
              className="md:hidden flex items-center gap-2 text-gray-600 mb-6 hover:text-[#3A5F4B]"
            >
              <ChevronRight size={20} className="rotate-180" /> Volver al menú
            </button>

            {activeTab === 'menu' && (
              <div className="hidden md:flex h-full items-center justify-center text-gray-400 flex-col gap-4">
                <Settings size={48} className="opacity-20" />
                <p>Selecciona una opción del menú para configurar</p>
              </div>
            )}

            {activeTab === 'perfil' && (
              <form onSubmit={handleSave} className="max-w-2xl relative pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Perfil de Usuario</h2>

                {/* Profile Picture Section */}
                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-4 text-[#3A5F4B]">Foto de Perfil</h3>
                  <div
                    className={cn(
                      "flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 border rounded-2xl transition-colors",
                      isDraggingProfile ? "border-[#3A5F4B] bg-[#3A5F4B]/10" : "border-[#3A5F4B]/10 bg-[#3A5F4B]/5"
                    )}
                    onDragOver={onProfileDragOver}
                    onDragLeave={onProfileDragLeave}
                    onDrop={onProfileDrop}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-24 h-24 rounded-full bg-[#3A5F4B]/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-[#3A5F4B]/30 bg-cover bg-center"
                        style={profileData.avatar ? { backgroundImage: `url('${profileData.avatar}')` } : {}}
                      >
                        {!profileData.avatar && <User size={32} className="text-[#3A5F4B]/40" />}
                        {isUploadingProfile && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Cargando...</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => profileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 bg-[#3A5F4B] text-white p-2 rounded-full shadow-lg hover:bg-[#2d4a3a] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-base text-gray-900">Foto de Perfil</p>
                      <p className="text-sm text-gray-500">PNG o JPG. Máx 2MB.</p>
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
                        className="mt-2 flex items-center justify-center gap-2 bg-[#3A5F4B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2d4a3a] transition-colors w-fit shadow-sm"
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
                  <h3 className="text-lg font-bold mb-4 text-[#3A5F4B]">Información Personal</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all text-gray-900"
                        type="text"
                        value={profileData.nombre}
                        onChange={e => setProfileData({ ...profileData, nombre: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all text-gray-900"
                        type="email"
                        value={profileData.email}
                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all text-gray-900"
                        type="tel"
                        value={profileData.telefono}
                        onChange={e => setProfileData({ ...profileData, telefono: e.target.value })}
                      />
                    </div>
                  </div>
                </section>

                {/* Save Action (Sticky Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-white via-white to-transparent z-10">
                  <button type="submit" className="w-full bg-[#3A5F4B] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#3A5F4B]/20 hover:bg-[#2d4a3a] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <Save size={20} />
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'empresa' && (
              <form onSubmit={handleSave} className="max-w-2xl relative pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de Empresa</h2>

                {/* Branding Section */}
                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-4 text-[#3A5F4B]">Marca (Branding)</h3>
                  <div
                    className={cn(
                      "flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 border rounded-2xl transition-colors",
                      isDragging ? "border-[#3A5F4B] bg-[#3A5F4B]/10" : "border-[#3A5F4B]/10 bg-[#3A5F4B]/5"
                    )}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-24 h-24 rounded-xl bg-[#3A5F4B]/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-[#3A5F4B]/30 bg-cover bg-center"
                        style={companyData.logo ? { backgroundImage: `url('${companyData.logo}')` } : {}}
                      >
                        {!companyData.logo && <Building2 size={32} className="text-[#3A5F4B]/40" />}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Cargando...</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 bg-[#3A5F4B] text-white p-2 rounded-full shadow-lg hover:bg-[#2d4a3a] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-base text-gray-900">Logo de la Empresa</p>
                      <p className="text-sm text-gray-500">PNG, JPG o SVG. Máx 2MB.</p>
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
                        className="mt-2 flex items-center justify-center gap-2 bg-[#3A5F4B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2d4a3a] transition-colors w-fit shadow-sm"
                        disabled={isUploading}
                      >
                        <Upload size={16} />
                        {isUploading ? 'Subiendo...' : 'Subir Nuevo'}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Business Information Section */}
                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-4 text-[#3A5F4B]">Información Comercial</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del Negocio</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all text-gray-900"
                        type="text"
                        value={companyData.nombre}
                        onChange={e => setCompanyData({ ...companyData, nombre: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">CUIT / ID Fiscal</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all text-gray-900"
                        placeholder="30-71234567-9"
                        type="text"
                        value={companyData.cuit}
                        onChange={e => setCompanyData({ ...companyData, cuit: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono Comercial</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all text-gray-900"
                        placeholder="+54 11 4567-8900"
                        type="tel"
                        defaultValue="+54 11 4567-8900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección Fiscal</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all text-gray-900"
                        placeholder="Av. Libertador 1234, CABA"
                        type="text"
                        value={companyData.direccion}
                        onChange={e => setCompanyData({ ...companyData, direccion: e.target.value })}
                      />
                    </div>
                  </div>
                </section>

                {/* Legal Terms Section */}
                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-4 text-[#3A5F4B]">Términos Legales</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Términos y Condiciones Predeterminados</label>
                    <p className="text-xs text-gray-500 mb-3">Estos términos se adjuntarán automáticamente a todos los nuevos presupuestos.</p>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all resize-none text-gray-900"
                      placeholder="Ingresa los términos de servicio, métodos de pago e información de garantía..."
                      rows={6}
                      value={companyData.terminos}
                      onChange={e => setCompanyData({ ...companyData, terminos: e.target.value })}
                    />
                  </div>
                </section>

                {/* Save Action (Sticky Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-white via-white to-transparent z-10">
                  <button type="submit" className="w-full bg-[#3A5F4B] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#3A5F4B]/20 hover:bg-[#2d4a3a] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <Save size={20} />
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'preferencias' && (
              <form onSubmit={handleSave} className="max-w-2xl relative pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Preferencias del Sistema</h2>

                {/* Currency Section */}
                <section className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-1 mb-3">Moneda</h3>
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-1 mb-3">Idioma</h3>
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-1 mb-3">Unidades de Medida</h3>
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-1 mb-3">Formato de Fecha</h3>
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
                  <button type="submit" className="w-full bg-[#3A5F4B] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#3A5F4B]/20 hover:bg-[#2d4a3a] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <Save size={20} />
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'notificaciones' && (
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Preferencias de Notificaciones</h2>
                <div className="space-y-4">
                  {[
                    { title: 'Notificaciones Push', desc: 'Recibir alertas en el navegador' },
                    { title: 'Correos Electrónicos', desc: 'Resumen diario de actividades' },
                    { title: 'Alertas de Stock', desc: 'Avisar cuando un material está bajo' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-[#3A5F4B]/10 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-800">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i !== 1} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A5F4B]"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-[#3A5F4B]/10 flex justify-end">
                  <button type="submit" className="bg-[#3A5F4B] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2d4a3a] transition-colors font-medium">
                    <Save size={18} />
                    Guardar Preferencias
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'seguridad' && (
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Seguridad de la Cuenta</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none" />
                  </div>
                </div>
                <div className="pt-6 border-t border-[#3A5F4B]/10 flex justify-start">
                  <button type="submit" className="bg-[#3A5F4B] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2d4a3a] transition-colors font-medium">
                    <Save size={18} />
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'apariencia' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Apariencia</h2>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <button className="border-2 border-[#3A5F4B] bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-gray-800"></div>
                    </div>
                    <span className="font-medium text-gray-800">Modo Claro</span>
                  </button>
                  <button className="border-2 border-transparent bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-full bg-gray-800 shadow-sm border border-gray-700 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white"></div>
                    </div>
                    <span className="font-medium text-gray-800">Modo Oscuro</span>
                    <span className="text-xs text-gray-500">(Próximamente)</span>
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
    <label className="group flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-[#3A5F4B]/50 transition-all active:scale-[0.98] bg-white">
      <div className="flex flex-col">
        <p className="text-gray-900 text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      </div>
      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", checked ? "border-[#3A5F4B]" : "border-gray-300")}>
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#3A5F4B]" />}
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
