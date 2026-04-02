import React, { useState } from 'react';
import {   Leaf, Mail, Lock, Eye, EyeOff, Fingerprint, HelpCircle, UserPlus, AlertCircle   } from 'lucide-react';
import { Logo } from '../components/Logo';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle } from '../lib/firebase';
import { useCompanyConfig } from '../hooks/useCompanyConfig';

export default function Login({ onLogin, onGuestLogin }: { onLogin: () => void, onGuestLogin?: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [companyData, , loadingConfig] = useCompanyConfig();

  const displayLogo = companyData?.logo;

  const handleUserRole = async (user: any) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      // Lista de correos con Nivel Dios (Dueños)
      const godTierEmails = ['famadasmanuela@gmail.com', 'famadasmanu@gmail.com', 'leandrofamadas15@gmail.com'];
      const isGod = godTierEmails.includes(user.email?.toLowerCase());

      if (!userSnap.exists()) {
        // Usuario nuevo: si es dueño, es admin. Si no, es operario.
        const defaultRole = isGod ? 'admin' : 'operario';
        await setDoc(userRef, {
          email: user.email,
          role: defaultRole,
          createdAt: new Date().toISOString()
        });
        window.localStorage.setItem('user_role', JSON.stringify(defaultRole));
      } else {
        // Usuario existente:
        let role = userSnap.data().role;
        
        // Ascender a admin automáticamente si el correo pertenece a los dueños pero estaba como operario
        if (isGod && role !== 'admin') {
          role = 'admin';
          await setDoc(userRef, { role: 'admin' }, { merge: true });
        }
        
        window.localStorage.setItem('user_role', JSON.stringify(role));
      }
    } catch (e) {
      console.error('Error sincronizando rol de usuario:', e);
      // Fallback seguro a admin si la red falla pero el correo es dueño
      const isGodFb = ['famadasmanuela@gmail.com', 'famadasmanu@gmail.com', 'leandrofamadas15@gmail.com'].includes(user.email?.toLowerCase());
      window.localStorage.setItem('user_role', JSON.stringify(isGodFb ? 'admin' : 'operario'));
    }
  };

 const handleEmailAuth = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email || !password) {
 setError('Por favor, ingresa tu correo y contraseña.');
 return;
 }
 setError('');
 setLoading(true);
 try {
      let userCredential;
 if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
 } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
 }
      // Sincronizar y verificar el rol en la nube antes de dejarlo entrar
      await handleUserRole(userCredential.user);

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
 const user = await signInWithGoogle();
 await handleUserRole(user);
 if (onLogin) onLogin();
 } catch (err) {
 setError('Error al iniciar sesión con Google.');
 }
 };

 return (
 <div className="min-h-[100dvh] bg-main bg-aurora flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans w-full">
 
 <div className="w-full max-w-md relative z-10 flex flex-col items-center justify-center py-4">
 {/* Logo outside the card */}
 <div className="flex flex-col items-center mb-8 md:mb-12 w-full mt-10 md:mt-16">
 <Logo className="h-[189px] md:h-[243px] drop-shadow-2xl max-w-full" />
 </div>

 {/* Main Login Card */}
 <div className="bg-card rounded-2xl p-5 md:p-10 shadow-2xl border border-bd-lines w-full">
 <div className="flex flex-col items-center mb-5 md:mb-8">
 <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-tx-primary">
 {isRegistering ? 'Crear una cuenta' : 'Iniciar Sesión'}
 </h1>
 <p className="text-xs md:text-sm font-medium mt-1 md:mt-2 text-tx-secondary text-center">
 {isRegistering ? 'Ingresa tus datos para registrarte' : 'Ingresa tus credenciales para acceder'}
 </p>
 </div>

 {/* Error Message */}
 {error && (
 <div className="mb-4 flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-xl text-xs md:text-sm border border-red-100 font-medium">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <p>{error}</p>
 </div>
 )}

 {/* Form */}
 <form className="space-y-3.5 md:space-y-5" onSubmit={handleEmailAuth}>
 {/* Email Field */}
 <div>
 <label className="block text-xs md:text-sm font-bold text-tx-secondary mb-1">
 Correo electrónico
 </label>
 <div className="relative">
 <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-tx-secondary w-4 h-4 md:w-5 md:h-5" />
 <input
 type="email"
 placeholder="nombre@empresa.com"
 className="w-full bg-main border border-bd-lines text-tx-primary rounded-xl px-9 md:px-11 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm md:text-base"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 />
 </div>
 </div>

 {/* Password Field */}
 <div>
 <label className="block text-xs md:text-sm font-bold text-tx-secondary mb-1">
 Contraseña
 </label>
 <div className="relative">
 <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-tx-secondary w-4 h-4 md:w-5 md:h-5" />
 <input
 type={showPassword ? "text" : "password"}
 placeholder="••••••••"
 className="w-full bg-main border border-bd-lines text-tx-primary rounded-xl pl-9 md:pl-11 pr-10 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all tracking-widest text-sm md:text-base"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-tx-secondary hover:text-accent transition-colors p-1"
 >
 {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
 </button>
 </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={loading}
 className="w-full bg-accent text-white font-bold md:text-lg py-2.5 md:py-3.5 mt-2 rounded-xl shadow-md hover:bg-[#15803d] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[44px] md:h-[54px]"
 >
 {loading ? (
 <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 ) : (
 isRegistering ? "Registrarse" : "Iniciar sesión"
 )}
 </button>
 </form>

 {/* Social Login (Google) */}
 <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-bd-lines flex flex-col gap-2.5">
 <button
 type="button"
 onClick={handleGoogleSignIn}
 className="w-full flex items-center justify-center gap-2 bg-card border border-bd-lines hover:bg-main py-2.5 md:py-3 rounded-xl font-bold text-tx-secondary transition-all shadow-sm text-sm"
 >
 <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24">
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
 onClick={async () => {
    try {
      setLoading(true);
      window.localStorage.setItem('user_role', JSON.stringify('invitado'));
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn("Firebase Anonymous blocked, bypassing locally for demo...");
      }
      if (onGuestLogin) onGuestLogin();
      if (onLogin) onLogin();
    } catch (err: any) {
      setError(err.message || 'Error al entrar como invitado');
      setLoading(false);
    }
  }}
 className="w-full flex items-center justify-center gap-2 bg-transparent border border-bd-lines hover:bg-main py-2.5 md:py-3 rounded-xl font-bold text-tx-secondary transition-all text-sm"
 >
 <span>Entrar como Invitado (Demo)</span>
 </button>
 )}
 </div>

 {/* Links */}
 <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4 md:mt-8 pt-4 md:pt-6 border-t border-bd-lines">
 <button 
 type="button" 
 onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
 className="text-[11px] md:text-sm font-bold text-accent hover:text-[#15803d] transition-colors flex items-center gap-1.5"
 >
 <UserPlus className="w-3.5 h-3.5" />
 {isRegistering ? '¿Ya tienes cuenta? Ingresa' : 'Crear nueva cuenta'}
 </button>
 <button type="button" className="text-[11px] md:text-sm font-medium text-tx-secondary hover:text-tx-primary transition-colors flex items-center gap-1.5">
 <HelpCircle className="w-3.5 h-3.5" />
 Contactar a soporte
 </button>
 </div>
 </div>

 {/* Footer */}
 <div className="mt-4 md:mt-8 text-center relative z-10">
 <p className="text-[10px] md:text-sm text-tx-secondary font-medium bg-card/50 backdrop-blur-sm px-3 md:px-4 py-1 md:py-1.5 rounded-full inline-block shadow-sm">
 © {new Date().getFullYear()} Argent Software. Todos los derechos reservados.
 </p>
 </div>
 </div>
 </div>
 );
}
