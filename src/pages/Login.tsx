import React, { useState } from 'react';
import { Leaf, Mail, Lock, Eye, EyeOff, Fingerprint, HelpCircle, UserPlus, AlertCircle } from 'lucide-react';

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
 <div className="min-h-screen bg-main flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
 {/* Dark background top half for logo visibility */}
 <div className="absolute top-0 left-0 w-full h-[350px] bg-accent"></div>
 
 <div className="w-full max-w-md relative z-10 my-8">
 {/* Logo outside the card, on the dark background */}
 <div className="flex flex-col items-center mb-8">
 {displayLogo ? (
 <div className="bg-white p-4 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.3)] border border-white/20 transition-all hover:scale-[1.02] mx-4 mb-4">
    <img src={displayLogo} alt="Logo" className="max-h-24 md:max-h-28 object-contain" referrerPolicy="no-referrer" />
  </div>
 ) : (
 <div className="flex flex-col items-center justify-center">
    <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-2 drop-shadow-lg">
      <div className="bg-white text-accent p-2 rounded-xl leading-none shadow-xl">AR</div> GEN
    </h1>
    <span className="font-bold text-xs tracking-[0.3em] uppercase text-center mt-2 leading-tight text-white/90 drop-shadow-md">
      SOFTWARE
    </span>
  </div>
 )}
 </div>

 {/* Main Login Card */}
 <div className="bg-card rounded-2xl p-8 md:p-10 shadow-2xl border border-bd-lines">
 <div className="flex flex-col items-center mb-8">
 <h1 className="text-3xl font-extrabold tracking-tight text-tx-primary">
 {isRegistering ? 'Crear una cuenta' : 'Iniciar Sesión'}
 </h1>
 <p className="text-sm font-medium mt-2 text-tx-secondary text-center">
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
 <label className="block text-sm font-bold text-tx-secondary mb-1.5">
 Correo electrónico
 </label>
 <div className="relative">
 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-tx-secondary w-5 h-5" />
 <input
 type="email"
 placeholder="nombre@empresa.com"
 className="w-full bg-main border border-bd-lines text-tx-primary rounded-xl px-11 py-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 />
 </div>
 </div>

 {/* Password Field */}
 <div>
 <label className="block text-sm font-bold text-tx-secondary mb-1.5">
 Contraseña
 </label>
 <div className="relative">
 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-tx-secondary w-5 h-5" />
 <input
 type={showPassword ? "text" : "password"}
 placeholder="••••••••"
 className="w-full bg-main border border-bd-lines text-tx-primary rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all tracking-widest"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-secondary hover:text-accent transition-colors p-1"
 >
 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
 </button>
 </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={loading}
 className="w-full bg-accent text-white font-bold text-lg py-3.5 mt-4 rounded-xl shadow-md hover:bg-[#15803d] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[54px]"
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
 <span className="text-sm font-semibold text-tx-secondary uppercase tracking-widest">O ingresa con tu huella</span>
 <button 
 type="button" 
 onClick={() => setError('La autenticación biométrica aún no está configurada.')}
 className="p-4 rounded-full bg-main border border-bd-lines text-accent hover:bg-accent hover:text-white transition-all shadow-sm group"
 >
 <Fingerprint className="w-8 h-8 group-hover:scale-110 transition-transform" />
 </button>
 </div>
 )}

 {/* Social Login (Google) */}
 <div className="mt-6 pt-6 border-t border-bd-lines">
 <button
 type="button"
 onClick={handleGoogleSignIn}
 className="w-full flex items-center justify-center gap-3 bg-card border border-bd-lines hover:bg-main py-3 rounded-xl font-bold text-tx-secondary transition-all shadow-sm"
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
 onClick={async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
      if (onGuestLogin) onGuestLogin();
      if (onLogin) onLogin();
    } catch (err: any) {
      setError(err.message || 'Error al entrar como invitado');
      setLoading(false);
    }
  }}
 className="w-full mt-3 flex items-center justify-center gap-3 bg-transparent border border-bd-lines hover:bg-main py-3 rounded-xl font-bold text-tx-secondary transition-all"
 >
 <span>Entrar como Invitado (Demo)</span>
 </button>
 )}
 </div>

 {/* Links */}
 <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-bd-lines">
 <button 
 type="button" 
 onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
 className="text-sm font-bold text-accent hover:text-[#15803d] transition-colors flex items-center gap-2"
 >
 <UserPlus className="w-4 h-4" />
 {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : 'Crear nueva cuenta'}
 </button>
 <button type="button" className="text-sm font-medium text-tx-secondary hover:text-tx-primary transition-colors flex items-center gap-2">
 <HelpCircle className="w-4 h-4" />
 Contactar a soporte
 </button>
 </div>
 </div>

 {/* Footer */}
 <div className="mt-8 text-center relative z-10">
 <p className="text-sm text-tx-secondary font-medium bg-card/50 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block shadow-sm">
 © {new Date().getFullYear()} Argent Software. Todos los derechos reservados.
 </p>
 </div>
 </div>
 </div>
 );
}
