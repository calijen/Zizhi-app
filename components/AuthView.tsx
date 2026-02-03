
import React, { useState } from 'react';
import { IconClose, IconSpinner, Logo, IconCloud } from './icons';
import { supabase, isSupabaseConfigured } from '../supabase';

interface AuthViewProps {
    onClose: () => void;
    onLogin: (user: any) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onClose, onLogin }) => {
    const [view, setView] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{message: string; isWarning?: boolean} | null>(null);

    const getFriendlyErrorMessage = (err: any) => {
        const msg = err.message?.toLowerCase() || '';
        
        // Network errors are the most common cause of "Failed to fetch"
        if (msg.includes('failed to fetch') || msg.includes('network error')) {
            return {
                message: "We're having trouble reaching the cloud. This might be a temporary connection issue. Please try again in a moment.",
                isWarning: false
            };
        }

        // Supabase returns generic "Invalid login credentials" for both wrong password AND missing account
        if (msg.includes('invalid login credentials')) {
            if (view === 'login') {
                return { 
                    message: "We couldn't find an account with that email and password. If you haven't created an account yet, please sign up below.", 
                    isWarning: false 
                };
            }
            return { message: "The login details provided are incorrect. Please try again.", isWarning: false };
        }

        if (msg.includes('user already registered')) {
            return { message: "An account with this email already exists! Try signing in instead.", isWarning: true };
        }

        if (msg.includes('email not confirmed')) {
            return { message: "Your account is ready, but needs to be activated. Please check your email for the confirmation link.", isWarning: true };
        }

        if (msg.includes('password should be at least 6 characters')) {
            return { message: "Please choose a password with at least 6 characters.", isWarning: false };
        }

        // Project specific issues
        if (msg.includes('api key') || msg.includes('not found')) {
            return { message: "Cloud sync is currently undergoing maintenance. Please try again later.", isWarning: false };
        }

        return { message: "Something went wrong. Please try again or continue reading offline.", isWarning: false };
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSupabaseConfigured()) return;
        
        setError(null);
        setIsLoading(true);

        try {
            if (view === 'login') {
                const { data, error: authError } = await supabase!.auth.signInWithPassword({ email, password });
                if (authError) throw authError;
                onLogin(data.user);
                onClose();
            } else {
                const { data, error: authError } = await supabase!.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (authError) throw authError;
                
                if (data.user && data.session) {
                    onLogin(data.user);
                    onClose();
                } else if (data.user) {
                    setError({ 
                        message: "Almost there! We've sent a confirmation link to " + email + ". Please click it to activate your account.", 
                        isWarning: true 
                    });
                    setEmail('');
                    setPassword('');
                }
            }
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupabaseConfigured()) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="relative w-full max-w-md bg-[var(--color-background)] rounded-2xl shadow-2xl p-10 text-center animate-fade-in">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-[var(--color-secondary-text)]"><IconClose className="w-6 h-6" /></button>
                    <div className="mb-6 w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                        <IconCloud className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif mb-4">Cloud Sync Offline</h2>
                    <p className="text-[var(--color-secondary-text)] text-sm mb-6 leading-relaxed">
                        Cloud features are currently unavailable. You can still read books and save quotes locally on this device.
                    </p>
                    <button onClick={onClose} className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">Continue Reading</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[var(--color-background)] md:bg-black/60 md:backdrop-blur-sm">
            <div className="hidden md:block absolute inset-0" onClick={onClose} />
            
            <div className="relative w-full h-full md:h-auto md:max-w-md bg-[var(--color-background)] md:rounded-2xl md:shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 animate-fade-in">
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-2 text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] transition-colors rounded-full"
                >
                    <IconClose className="w-6 h-6" />
                </button>

                <div className="w-full max-w-sm space-y-8 py-10">
                    <div className="text-center">
                        <Logo className="h-10 w-auto text-[var(--color-primary-text)] mx-auto mb-6" />
                        <h2 className="text-3xl font-bold font-serif text-[var(--color-primary-text)] mb-3">
                            {view === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-[var(--color-secondary-text)] text-sm leading-relaxed">
                            {view === 'login' 
                                ? 'Sign in to sync your library across devices.' 
                                : 'Sign up to keep your reading progress safe in the cloud.'}
                        </p>
                    </div>

                    {error && (
                        <div className={`p-4 border text-sm rounded-xl text-center font-medium animate-fade-in ${
                            error.isWarning 
                            ? 'bg-blue-50 border-blue-100 text-blue-700' 
                            : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                            {error.message}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary-text)] ml-1">Email Address</label>
                            <input 
                                type="email" required value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[rgba(var(--color-border-color-rgb),0.1)] border border-[var(--color-border-color)] rounded-xl py-3 px-4 outline-none focus:border-[var(--color-primary)] transition-all text-[var(--color-primary-text)]"
                                placeholder="name@example.com"
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary-text)] ml-1">Password</label>
                            <input 
                                type="password" required value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[rgba(var(--color-border-color-rgb),0.1)] border border-[var(--color-border-color)] rounded-xl py-3 px-4 outline-none focus:border-[var(--color-primary)] transition-all text-[var(--color-primary-text)]"
                                placeholder="At least 6 characters"
                                autoComplete={view === 'login' ? "current-password" : "new-password"}
                            />
                        </div>

                        <button 
                            type="submit" disabled={isLoading}
                            className="w-full bg-[var(--color-primary)] text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2 disabled:opacity-50"
                        >
                            {isLoading ? <IconSpinner className="w-5 h-5" /> : (view === 'login' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <div className="text-sm">
                            <span className="text-[var(--color-secondary-text)]">
                                {view === 'login' ? "Don't have an account?" : "Already a member?"}
                            </span>
                            <button 
                                onClick={() => {
                                    setView(view === 'login' ? 'signup' : 'login');
                                    setError(null);
                                }}
                                className="ml-2 font-bold text-[var(--color-primary)] hover:underline"
                            >
                                {view === 'login' ? 'Join Zizhi' : 'Sign in here'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
