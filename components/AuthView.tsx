
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconClose, IconSpinner, IconEye, IconEyeOff } from './icons';
import { auth, signInWithGoogle } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthViewProps {
    onClose: () => void;
    onLogin: (user: any) => void;
    onEnterGuest?: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onClose, onLogin, onEnterGuest }) => {
    const [view, setView] = useState<'login' | 'signup'>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{message: string; isWarning?: boolean} | null>(null);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            let userCredential;
            if (view === 'login') {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            }
            onLogin(userCredential.user);
            onClose();
        } catch (err: any) {
            setError({ message: err.message || "Authentication error.", isWarning: false });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const user = await signInWithGoogle();
            onLogin(user);
            onClose();
        } catch (err: any) {
            setError({ message: err.message || "Authentication error.", isWarning: false });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000] flex items-center justify-center p-4 md:p-6"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-[var(--color-background)] border-4 border-black shadow-[12px_12px_0px_black] relative flex flex-col items-center p-8 md:p-12"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[var(--color-primary-text)] hover:bg-black/5 transition-colors" aria-label="Close auth">
                    <IconClose className="w-6 h-6" />
                </button>
                
                <header className="text-center mb-8 w-full">
                    <h2 className="text-3xl font-black mb-2 uppercase tracking-tight text-[var(--color-primary-text)]">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted-text)]">Sync your library across all devices</p>
                </header>

                {error && (
                    <div className={`w-full p-4 mb-6 text-xs border-4 text-center leading-relaxed ${error.isWarning ? 'bg-blue-50 border-blue-600 text-blue-800 font-black' : 'bg-red-50 border-red-600 text-red-800 font-black'}`}>
                        {error.message}
                    </div>
                )}

                <div className="w-full space-y-6">
                    <button 
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="w-full bg-white text-black border-4 border-black font-black uppercase py-4 flex items-center justify-center gap-3 hover:translate-y-[-2px] hover:shadow-[4px_4px_0_black] transition-all text-xs tracking-widest"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative flex items-center justify-center py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-black/10"></div>
                        </div>
                        <span className="relative px-4 bg-[var(--color-background)] text-[10px] font-black uppercase text-[var(--color-muted-text)]">or email</span>
                    </div>

                    <form onSubmit={handleEmailAuth} className="w-full space-y-4">
                        <div className="space-y-1">
                            <input 
                                type="email" 
                                required 
                                placeholder="EMAIL ADDRESS" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="w-full bg-[var(--color-surface)] border-4 border-black p-4 outline-none font-bold text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] opacity-80 focus:opacity-100 focus:shadow-[4px_4px_0_black] transition-all text-xs" 
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    placeholder="PASSWORD" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="w-full bg-[var(--color-surface)] border-4 border-black p-4 outline-none font-bold text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] opacity-80 pr-12 focus:opacity-100 focus:shadow-[4px_4px_0_black] transition-all text-xs" 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--color-muted-text)] hover:text-[var(--color-primary-text)]">
                                    {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            disabled={isLoading} 
                            className="w-full bg-[var(--color-primary)] text-white border-4 border-black font-black uppercase py-5 shadow-[6px_6px_0_black] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_black] active:translate-y-1 active:shadow-none transition-all mt-4 text-xs tracking-widest"
                        >
                            {isLoading ? <IconSpinner className="w-6 h-6 mx-auto animate-spin" /> : (view === 'login' ? 'Login' : 'Sign Up')}
                        </button>
                    </form>
                </div>

                <footer className="text-center mt-8 w-full space-y-3">
                    <p className="text-[10px] font-black text-[var(--color-muted-text)] uppercase tracking-widest">
                        {view === 'login' ? "New around here?" : "Already a member?"} 
                        <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="ml-2 text-[var(--color-primary)] hover:underline decoration-2 underline-offset-4 transition-colors">
                            {view === 'login' ? 'Create Account' : 'Login'}
                        </button>
                    </p>
                    {onEnterGuest && (
                        <div>
                            <button 
                                type="button" 
                                onClick={() => {
                                    onClose();
                                    onEnterGuest();
                                }} 
                                className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-text)] hover:underline opacity-80 hover:opacity-100"
                            >
                                Continue as Guest →
                            </button>
                        </div>
                    )}
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default AuthView;
