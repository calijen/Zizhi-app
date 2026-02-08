
import React, { useState, useMemo } from 'react';
import { IconLibrary, IconQuote, Logo } from './icons';
import type { Book, ReadingActivity } from '../types';

interface ProfileViewProps {
  user: any;
  streak: number;
  library: Book[];
  onShowAuth: () => void;
  activity: ReadingActivity[];
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, streak, library, onShowAuth, activity }) => {
    const [streakType, setStreakType] = useState<'daily' | 'weekly'>('daily');
    
    const totalReadingTimeHours = useMemo(() => {
        const seconds = library.reduce((acc, book) => acc + (book.readingTime || 0), 0);
        return (seconds / 3600).toFixed(1);
    }, [library]);

    const weeklyStreak = useMemo(() => {
        if (activity.length === 0) return 0;
        const weeksRead = new Set();
        activity.forEach(a => {
            const date = new Date(a.date);
            // Calculate a unique week identifier
            const weekId = `${date.getFullYear()}-W${Math.floor(date.getDate() / 7)}`;
            weeksRead.add(weekId);
        });
        return weeksRead.size;
    }, [activity]);

    const genreStats = useMemo(() => {
        const counts: Record<string, number> = {};
        library.forEach(b => {
            const g = b.genre || "Literary Fiction";
            counts[g] = (counts[g] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [library]);

    if (!user) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-fade-in">
                <div className="p-12 bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border-color)] w-full shadow-xl">
                    <h2 className="text-3xl font-black theme-serif mb-6 text-[var(--color-primary-text)]">Journey Sync</h2>
                    <p className="text-sm text-[var(--color-secondary-text)] mb-12 leading-relaxed font-medium">Persist your library, insights, and reading pulse across all devices instantly.</p>
                    <button onClick={onShowAuth} className="w-full py-5 bg-[var(--color-primary)] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Sign In</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-12 animate-fade-in max-w-4xl mx-auto pb-40">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black theme-serif text-[var(--color-primary-text)]">Journey</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-secondary-text)] opacity-60 mt-2">Personal Literary Analytics</p>
                </div>
                <div className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-lg">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </header>

            <div className="flex flex-col items-center justify-center py-16 relative bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border-color)] shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-primary)] mb-4">Total Hours Devoured</p>
                <div className="text-8xl font-black text-[var(--color-primary-text)] tabular-nums tracking-tighter mb-4">{totalReadingTimeHours}</div>
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-xs font-bold text-[var(--color-secondary-text)] opacity-60 uppercase tracking-widest">Active Momentum Detected</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="p-10 bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border-color)] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] mb-4">Library Depth</p>
                    <div className="text-5xl font-black text-[var(--color-primary-text)]">{library.length}</div>
                    <p className="text-[10px] font-bold text-[var(--color-secondary-text)] uppercase mt-2 opacity-40">Volumes Collected</p>
                </div>
                <div className="p-10 bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border-color)] relative shadow-sm">
                    <div className="absolute top-6 right-6 flex bg-black/5 rounded-full p-1 border border-black/5 shadow-inner">
                        <button onClick={() => setStreakType('daily')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${streakType === 'daily' ? 'bg-white text-black shadow-sm' : 'text-[var(--color-secondary-text)] opacity-60'}`}>Day</button>
                        <button onClick={() => setStreakType('weekly')} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${streakType === 'weekly' ? 'bg-white text-black shadow-sm' : 'text-[var(--color-secondary-text)] opacity-60'}`}>Week</button>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] mb-4">Reading Momentum</p>
                    <div className="text-5xl font-black text-[var(--color-primary-text)]">{streakType === 'daily' ? streak : weeklyStreak}</div>
                    <p className="text-[10px] font-bold text-[var(--color-secondary-text)] uppercase mt-2 opacity-40">Consistency Index</p>
                </div>
            </div>

            <section className="bg-[var(--color-surface)] border border-[var(--color-border-color)] rounded-[3rem] p-10 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-[var(--color-primary-text)]">Genre Mastery</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-black/5 rounded-full border border-black/5">Computed via AI</span>
                </div>
                {genreStats.length > 0 ? (
                    <div className="space-y-6">
                        {genreStats.slice(0, 5).map(([genre, count]) => (
                            <div key={genre} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-text)]">{genre}</span>
                                    <span className="text-[10px] font-bold text-[var(--color-secondary-text)] opacity-50">{count} {count === 1 ? 'Volume' : 'Volumes'}</span>
                                </div>
                                <div className="h-2.5 bg-black/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000" style={{ width: `${(count / library.length) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center text-[var(--color-secondary-text)] opacity-30 italic">
                        <IconLibrary className="w-12 h-12 mb-4 opacity-10" />
                        <p className="text-sm font-bold">Populate your library to unveil your genre profile.</p>
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-2xl font-black text-[var(--color-primary-text)]">Recent Pulse</h3>
                </div>
                <div className="space-y-5">
                    {library.length > 0 ? library.filter(b => b.progress > 0).sort((a,b) => (b.lastOpened || 0) - (a.lastOpened || 0)).slice(0, 4).map(book => (
                        <div key={book.id} className="group flex items-center gap-6 p-6 bg-[var(--color-surface)] rounded-[2rem] border border-[var(--color-border-color)] shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                            <div className="w-16 h-20 bg-black/5 rounded-xl overflow-hidden flex-shrink-0 border border-[var(--color-border-color)] shadow-inner">
                                {book.coverImageUrl && <img src={book.coverImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-black text-base text-[var(--color-primary-text)] truncate">{book.title}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary-text)] opacity-50 mt-1">{book.genre || 'In detection...'}</p>
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${book.progress * 100}%` }} />
                                    </div>
                                    <span className="text-[10px] font-black text-[var(--color-secondary-text)] tabular-nums">{Math.round(book.progress * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center text-[var(--color-secondary-text)] opacity-20 italic bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border-color)] border-dashed">
                            Capture your first story to track your pulse.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ProfileView;
