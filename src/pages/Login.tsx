import React, { useState } from 'react';
import { Leaf, Mail, Lock, Eye, EyeOff, Fingerprint, HelpCircle, UserPlus, AlertCircle } from 'lucide-react';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle } from '../lib/firebase';

export default function Login({ onLogin, onGuestLogin }: { onLogin: () => void, onGuestLogin?: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [companyData] = useState(() => {
    try {
      const item = window.localStorage.getItem('config_company');
      return item ? JSON.parse(item) : {
        nombre: 'GreenFields Landscapes',
        cuit: '30-12345678-9',
        direccion: 'Av. Libertador 1234, CABA',
        terminos: 'El presupuesto tiene una validez de 15 días. Pago del 50% por adelantado.',
        logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASkzUC9DNQrHglh2e6G7kg1CWectkzqVhy57Hmk5Y_xJ8h8Bx7GvT1k4Ly9_iy6dcXfpdIZQESlcPmdQKYj5YVSpvkKqmr_Vcuhdt0fKCfuqVjWxo_u4lnNkOhd2GWjVo9vAFHN1Kd03Kh0orAXNaQdZKMtek2kD1DzV1TChRTd3FyAjK1cTCGRn0-aX9LEmkINiHbPuecU-qOFxiU54SNvsbVAuLBX5H32OR8MoubDtTpE2E4NdLS3ZN6bCr4ZlxdCNOiztCVBLM'
      };
    } catch {
      return {
        nombre: 'GreenFields Landscapes',
        cuit: '30-12345678-9',
        direccion: 'Av. Libertador 1234, CABA',
        terminos: 'El presupuesto tiene una validez de 15 días. Pago del 50% por adelantado.',
        logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASkzUC9DNQrHglh2e6G7kg1CWectkzqVhy57Hmk5Y_xJ8h8Bx7GvT1k4Ly9_iy6dcXfpdIZQESlcPmdQKYj5YVSpvkKqmr_Vcuhdt0fKCfuqVjWxo_u4lnNkOhd2GWjVo9vAFHN1Kd03Kh0orAXNaQdZKMtek2kD1DzV1TChRTd3FyAjK1cTCGRn0-aX9LEmkINiHbPuecU-qOFxiU54SNvsbVAuLBX5H32OR8MoubDtTpE2E4NdLS3ZN6bCr4ZlxdCNOiztCVBLM'
      };
    }
  });

  const displayLogo = companyData?.logo;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (onLogin) onLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El correo electrónico ya está registrado.');
      } else {
        setError('Ocurrió un error al ' + (isRegistering ? 'crear la cuenta.' : 'iniciar sesión.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
      if (onLogin) onLogin();
    } catch (err) {
      setError('Error al iniciar sesión con Google.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dark background top half for logo visibility */}
      <div className="absolute top-0 left-0 w-full h-[350px] bg-[#3A5F4B]"></div>
      
      <div className="w-full max-w-md relative z-10 my-8">
        {/* Logo outside the card, on the dark background */}
        <div className="flex flex-col items-center mb-8">
          {displayLogo ? (
            <img src={displayLogo} alt="Logo" className="h-28 md:h-36 object-contain drop-shadow-md rounded-2xl" referrerPolicy="no-referrer" />
          ) : (
            <div className="bg-white/20 p-6 rounded-full mb-2 backdrop-blur-sm">
              <Leaf className="text-white w-16 h-16" />
            </div>
          )}
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-2xl border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isRegistering ? 'Crear una cuenta' : 'Iniciar Sesión'}
            </h1>
            <p className="text-sm font-medium mt-2 text-slate-500 text-center">
              {isRegistering ? 'Ingresa tus datos para registrarte' : 'Ingresa tus credenciales para acceder a tu cuenta'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleEmailAuth}>
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="nombre@empresa.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-11 py-3 focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] transition-all tracking-widest"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3A5F4B] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3A5F4B] text-white font-bold text-lg py-3.5 mt-4 rounded-xl shadow-md hover:bg-[#2d4a3a] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[54px]"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isRegistering ? "Registrarse" : "Iniciar sesión"
              )}
            </button>
          </form>

          {/* Biometric Login */}
          {!isRegistering && (
            <div className="flex flex-col items-center justify-center mt-8 gap-3">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">O ingresa con tu huella</span>
              <button 
                type="button" 
                onClick={() => setError('La autenticación biométrica aún no está configurada.')}
                className="p-4 rounded-full bg-slate-50 border border-slate-200 text-[#3A5F4B] hover:bg-[#3A5F4B] hover:text-white transition-all shadow-sm group"
              >
                <Fingerprint className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}

          {/* Social Login (Google) */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 py-3 rounded-xl font-bold text-slate-700 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continuar con Google</span>
            </button>
            
            {onGuestLogin && (
              <button
                type="button"
                onClick={onGuestLogin}
                className="w-full mt-3 flex items-center justify-center gap-3 bg-transparent border border-slate-300 hover:bg-slate-50 py-3 rounded-xl font-bold text-slate-600 transition-all"
              >
                <span>Entrar como Invitado (Demo)</span>
              </button>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-sm font-bold text-[#3A5F4B] hover:text-[#2d4a3a] transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : 'Crear nueva cuenta'}
            </button>
            <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Contactar a soporte
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-slate-500 font-medium bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block shadow-sm">
            © {new Date().getFullYear()} IRRIDELTA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
