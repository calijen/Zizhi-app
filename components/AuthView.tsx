
import React, { useState } from 'react';
import { IconClose, IconSpinner, Logo, IconGoogle } from './icons';
import { supabase, isSupabaseConfigured } from '../supabase';

interface AuthViewProps {
    onClose: () => void;
    onLogin: (user: any) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onClose, onLogin }) => {
    const [view, setView] = useState<'login' | 'signup'>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{message: string; isWarning?: boolean} | null>(null);

    const handleGoogleLogin = async () => {
        if (!isSupabaseConfigured()) {
            setError({ message: "Supabase API key is missing. Please check supabase.ts", isWarning: false });
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (authError) throw authError;
        } catch (err: any) {
            setError({ message: err.message || "Google Login failed.", isWarning: false });
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!isSupabaseConfigured()) {
                throw new Error("Supabase API key is not configured correctly in supabase.ts");
            }

            if (view === 'login') {
                const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
                if (authError) throw authError;
                onLogin(data.user);
                onClose();
            } else {
                const { data, error: authError } = await supabase.auth.signUp({ email, password });
                if (authError) {
                    if (authError.message.includes('apiKey')) {
                        throw new Error("Invalid API Key. Please ensure the key in supabase.ts is correct.");
                    }
                    throw authError;
                }
                
                if (data.user && data.session) {
                    onLogin(data.user);
                    onClose();
                } else {
                    setError({ message: "Welcome! Please check your email to confirm your account.", isWarning: true });
                }
            }
        } catch (err: any) {
            setError({ message: err.message || "Authentication error occurred.", isWarning: false });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[var(--color-background)] flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto">
            {/* Close Button */}
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 text-[var(--color-secondary-text)] hover:bg-black/5 rounded-full transition-all"
                aria-label="Close"
            >
                <IconClose className="w-6 h-6" />
            </button>
            
            <div className="w-full max-w-sm flex flex-col items-center">
                <header className="text-center mb-10">
                    <div className="mb-6 flex justify-center scale-110">
                        <Logo className="h-10 w-auto text-[var(--color-primary-text)]" />
                    </div>
                    <h1 className="text-2xl font-bold font-serif mb-2 text-[var(--color-primary-text)]">
                        {view === 'login' ? 'Welcome Back' : 'Join Zizhi'}
                    </h1>
                    <p className="text-sm text-[var(--color-secondary-text)] opacity-80">
                        Synchronize your library across devices.
                    </p>
                </header>

                {error && (
                    <div className={`w-full p-4 mb-6 text-sm rounded-xl border leading-relaxed text-center animate-fade-in ${error.isWarning ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-600 font-bold'}`}>
                        {error.message}
                    </div>
                )}

                <div className="w-full space-y-6">
                    {/* Standalone Google Button */}
                    <button 
                        onClick={handleGoogleLogin} 
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <IconGoogle className="w-5 h-5" />
                        <span>Continue with Google</span>
                    </button>

                    <div className="relative flex items-center gap-4">
                        <div className="flex-1 h-px bg-[var(--color-border-color)] opacity-60" />
                        <span className="text-[10px] font-bold text-[var(--color-secondary-text)] uppercase tracking-widest opacity-40">Or use email</span>
                        <div className="flex-1 h-px bg-[var(--color-border-color)] opacity-60" />
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailAuth} className="w-full space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--color-secondary-text)] uppercase tracking-wider ml-1">Email Address</label>
                            <input 
                                type="email" 
                                required 
                                placeholder="name@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:border-blue-500 focus:bg-white transition-all text-base text-slate-900 placeholder:text-slate-400 font-medium"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--color-secondary-text)] uppercase tracking-wider ml-1">Password</label>
                            <input 
                                type="password" 
                                required 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 outline-none focus:border-blue-500 focus:bg-white transition-all text-base text-slate-900 placeholder:text-slate-400 font-medium"
                            />
                        </div>
                        <button 
                            disabled={isLoading} 
                            className="w-full bg-[var(--color-primary)] text-white font-bold py-3.5 rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <IconSpinner className="w-5 h-5" /> : (view === 'login' ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>
                </div>

                <footer className="text-center mt-10">
                    <p className="text-sm text-[var(--color-secondary-text)]">
                        {view === 'login' ? "Don't have an account?" : "Already a member?"}
                        <button 
                            onClick={() => setView(view === 'login' ? 'signup' : 'login')} 
                            className="ml-2 text-[var(--color-primary)] font-bold hover:underline"
                        >
                            {view === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default AuthView;
