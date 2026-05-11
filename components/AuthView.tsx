
import React, { useState } from 'react';
import { IconClose, IconSpinner, IconEye, IconEyeOff } from './icons';
import { auth, signInWithGoogle } from '../firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail 
} from 'firebase/auth';

interface AuthViewProps {
    onClose: () => void;
    onLogin: (user: any) => void;
    hideClose?: boolean;
}

const LoginRobot = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="200" height="200" className="mx-auto mb-4">
      <defs>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4FC3F7" stopOpacity={1} />
          <stop offset="100%" stopColor="#0288D1" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0E0E0" stopOpacity={1} />
          <stop offset="100%" stopColor="#9E9E9E" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#263238" stopOpacity={1} />
          <stop offset="100%" stopColor="#37474F" stopOpacity={1} />
        </linearGradient>
        <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFEB3B" stopOpacity={1} />
          <stop offset="100%" stopColor="#FBC02D" stopOpacity={1} />
        </radialGradient>
        <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF7043" stopOpacity={1} />
          <stop offset="100%" stopColor="#F4511E" stopOpacity={1} />
        </linearGradient>
      </defs>
      <ellipse cx="256" cy="460" rx="120" ry="20" fill="#000000" opacity="0.15" />
      <g>
        <g transform="translate(0, 10)">
          <path d="M210 380 L210 430 Q210 450 190 450 L180 450 Q160 450 160 430 L160 420" fill="none" stroke="#546E7A" strokeWidth="20" strokeLinecap="round" />
          <path d="M302 380 L302 430 Q302 450 322 450 L332 450 Q352 450 352 430 L352 420" fill="none" stroke="#546E7A" strokeWidth="20" strokeLinecap="round" />
          <path d="M150 430 Q150 455 185 455 L195 455 Q230 455 230 430 L230 420 L150 420 Z" fill="url(#metalGradient)" />
          <path d="M292 430 Q292 455 327 455 L337 455 Q372 455 372 430 L372 420 L292 420 Z" fill="url(#metalGradient)" />
        </g>
        <path d="M160 280 Q120 280 120 330 Q120 360 150 360" fill="none" stroke="#546E7A" strokeWidth="24" strokeLinecap="round" />
        <circle cx="160" cy="280" r="15" fill="#CFD8DC" />
        <path d="M352 280 Q410 260 420 200" fill="none" stroke="#546E7A" strokeWidth="24" strokeLinecap="round" />
        <circle cx="352" cy="280" r="15" fill="#CFD8DC" />
        <g transform="translate(420, 200) rotate(-20)">
          <circle cx="0" cy="0" r="20" fill="#CFD8DC" />
          <path d="M-15 -10 L-25 -40 Q-30 -55 -15 -55 L-5 -55 Q10 -55 5 -40 L-5 -10 Z" fill="#CFD8DC" />
          <path d="M15 -10 L25 -40 Q30 -55 15 -55 L5 -55 Q-10 -55 -5 -40 L5 -10 Z" fill="#CFD8DC" />
        </g>
        <rect x="160" y="240" width="192" height="160" rx="40" ry="40" fill="url(#bodyGradient)" />
        <rect x="206" y="280" width="100" height="80" rx="10" ry="10" fill="#FFFFFF" opacity="0.8" />
        <path d="M241 310 L271 310 L271 335 L241 335 Z" fill="#FF7043" />
        <path d="M246 310 L246 300 Q246 290 256 290 Q266 290 266 300 L266 310" fill="none" stroke="#FF7043" strokeWidth="4" />
        <circle cx="256" cy="322" r="3" fill="#FFFFFF" />
        <rect x="236" y="220" width="40" height="30" fill="#78909C" />
        <g transform="translate(256, 160) rotate(-5)">
          <rect x="-5" y="-90" width="10" height="40" fill="#78909C" />
          <circle cx="0" cy="-90" r="12" fill="url(#antennaGlow)" />
          <rect x="-100" y="-60" width="200" height="140" rx="50" ry="50" fill="url(#bodyGradient)" />
          <rect x="-80" y="-40" width="160" height="80" rx="30" ry="30" fill="url(#screenGradient)" />
          <g>
            <circle cx="-40" cy="-10" r="22" fill="#FFFFFF" />
            <circle cx="-40" cy="-10" r="10" fill="#0277BD" />
            <circle cx="40" cy="-10" r="26" fill="#FFFFFF" />
            <circle cx="40" cy="-10" r="12" fill="#0277BD" />
          </g>
          <path d="M-20 20 Q0 30 20 20" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </g>
        <g transform="translate(150, 350) rotate(-10)">
          <rect x="-10" y="-5" width="80" height="90" rx="5" fill="#D84315" />
          <rect x="0" y="0" width="75" height="85" rx="4" fill="url(#bookGradient)" />
          <rect x="5" y="5" width="65" height="75" rx="2" fill="#FFF3E0" />
        </g>
      </g>
    </svg>
);

const AuthView: React.FC<AuthViewProps> = ({ onClose, onLogin, hideClose }) => {
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
            if (view === 'login') {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                onLogin(userCredential.user);
                onClose();
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                onLogin(userCredential.user);
                onClose();
            }
        } catch (err: any) {
            setError({ message: err.message || "Authentication error.", isWarning: false });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const user = await signInWithGoogle();
            onLogin(user);
            onClose();
        } catch (err: any) {
            setError({ message: err.message || "Google sign-in failed.", isWarning: false });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError({ message: "Enter your email first.", isWarning: true });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setError({ message: "Password reset email sent!", isWarning: true });
        } catch (err: any) {
            setError({ message: err.message || "Error sending reset email.", isWarning: false });
        }
    };

    return (
        <div className="w-full min-h-full bg-[var(--color-background)] flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto no-scrollbar">
            {!hideClose && (
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-[var(--color-primary-text)] hover:bg-black/10 transition-colors rounded-none z-[110]" aria-label="Close auth">
                    <IconClose className="w-8 h-8" />
                </button>
            )}
            
            <div className="w-full max-w-sm flex flex-col items-center py-12">
                <header className="text-center mb-8">
                    <LoginRobot />
                    <h1 className="text-3xl font-black mb-2 text-[var(--color-primary-text)] uppercase tracking-tight">{view === 'login' ? 'Welcome Back' : 'Get Started'}</h1>
                    <p className="text-sm text-[var(--color-muted-text)] font-black uppercase tracking-widest">Store your credentials in the cloud</p>
                </header>

                {error && (
                    <div className={`w-full p-4 mb-8 text-sm border-4 text-center leading-relaxed ${error.isWarning ? 'bg-blue-50 border-blue-600 text-blue-800 font-black' : 'bg-red-50 border-red-600 text-red-800 font-black'}`}>
                        {error.message}
                    </div>
                )}

                <div className="w-full space-y-6">
                    <form onSubmit={handleEmailAuth} className="w-full space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-[var(--color-secondary-text)] ml-1 tracking-widest">Email Identity</label>
                            <input 
                                type="email" 
                                required 
                                placeholder="name@domain.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="w-full bg-[var(--color-surface)] border-4 border-[var(--color-border-color)] p-4 outline-none font-black text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] focus:shadow-[4px_4px_0_var(--color-border-color)] transition-all text-base" 
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-[var(--color-secondary-text)] ml-1 tracking-widest">Secret Key</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    placeholder="••••••••" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="w-full bg-[var(--color-surface)] border-4 border-[var(--color-border-color)] p-4 outline-none font-black text-[var(--color-primary-text)] placeholder:text-[var(--color-muted-text)] pr-14 focus:shadow-[4px_4px_0_var(--color-border-color)] transition-all text-base" 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[var(--color-muted-text)] hover:text-[var(--color-primary-text)] transition-colors">
                                    {showPassword ? <IconEyeOff className="w-6 h-6" /> : <IconEye className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            disabled={isLoading} 
                            className="w-full bg-cyan-400 text-black border-4 border-black font-black uppercase py-5 shadow-[8px_8px_0_black] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_black] active:translate-y-1 active:shadow-none transition-all mt-6 text-sm tracking-[0.2em] rounded-none"
                        >
                            {isLoading ? <IconSpinner className="w-8 h-8 mx-auto" /> : (view === 'login' ? 'Authenticate' : 'Register')}
                        </button>

                        <div className="relative py-4 flex items-center gap-4">
                            <div className="flex-1 h-[2px] bg-black opacity-10"></div>
                            <span className="text-[10px] font-black uppercase opacity-40">OR</span>
                            <div className="flex-1 h-[2px] bg-black opacity-10"></div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full bg-white text-black border-4 border-black font-black uppercase py-5 shadow-[8px_8px_0_black] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_black] active:translate-y-1 active:shadow-none transition-all text-sm tracking-[0.2em] rounded-none flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </button>
                    </form>
                </div>

                <footer className="text-center mt-12 w-full space-y-6">
                    <button onClick={handleResetPassword} className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary-text)] bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0_black] hover:translate-y-1 hover:shadow-none transition-all block mx-auto rounded-none">Forgot Secret Key?</button>
                    <p className="text-xs font-black text-[var(--color-muted-text)] uppercase tracking-widest">
                        {view === 'login' ? "Identity unknown?" : "Registered user?"} 
                        <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="ml-2 text-pink-600 font-black underline decoration-4 underline-offset-4 hover:text-pink-700 transition-colors">
                            {view === 'login' ? 'Create Hub Account' : 'Log Into Archive'}
                        </button>
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default AuthView;
