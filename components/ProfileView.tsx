
import React, { useState, useMemo, useEffect } from 'react';
import { Box, Group, Stack, Text, SimpleGrid } from '@mantine/core';
import type { Book, ReadingActivity } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { IconSpinner } from './icons';

interface ProfileViewProps {
  user: any;
  streak: number;
  library: Book[];
  onShowAuth: () => void;
  activity: ReadingActivity[];
  onSignOut: () => void;
}

interface Recommendation {
    title: string;
    author: string;
    coverUrl: string | null;
}

/**
 * Utility to safely extract and parse JSON from an AI response string.
 * Handles cases where the AI wraps JSON in markdown blocks.
 */
const safeJsonParse = (text: string) => {
    try {
        // Attempt 1: Direct parse
        return JSON.parse(text);
    } catch (e) {
        // Attempt 2: Extract content between ```json and ```
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch (e2) {
                console.error("Failed to parse extracted JSON block", e2);
            }
        }
        // Attempt 3: Try to find any array/object looking structure
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            try {
                return JSON.parse(text.substring(firstBracket, lastBracket + 1));
            } catch (e3) {
                console.error("Failed to parse bracketed content", e3);
            }
        }
        throw new Error("Could not parse AI response as JSON");
    }
};

const StreakRobot = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="200" height="200" className="mx-auto">
      <defs>
        <linearGradient id="bodyGradientStreak" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4FACFE" stopOpacity={1} />
          <stop offset="100%" stopColor="#00F2FE" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="flameGradient" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#FF416C" stopOpacity={1} />
          <stop offset="50%" stopColor="#FF4B2B" stopOpacity={1} />
          <stop offset="100%" stopColor="#FFC837" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="faceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#203A43" stopOpacity={1} />
          <stop offset="100%" stopColor="#2C5364" stopOpacity={1} />
        </linearGradient>
      </defs>
      <ellipse cx="256" cy="480" rx="140" ry="20" fill="#000000" opacity="0.15" />
      <path d="M200 400 L200 450 A10 10 0 0 0 210 460 L230 460 A10 10 0 0 0 240 450 L240 400 Z" fill="#333" />
      <path d="M272 400 L272 450 A10 10 0 0 0 282 460 L302 460 A10 10 0 0 0 312 450 L312 400 Z" fill="#333" />
      <rect x="126" y="180" width="260" height="240" rx="60" ry="60" fill="url(#bodyGradientStreak)" stroke="#2b6cb0" strokeWidth="4" />
      <rect x="156" y="210" width="200" height="120" rx="30" ry="30" fill="url(#faceGradient)" stroke="#1a2a33" strokeWidth="3" />
      <g>
        <circle cx="210" cy="260" r="25" fill="#fff" />
        <circle cx="210" cy="260" r="10" fill="#333" />
        <circle cx="300" cy="260" r="32" fill="#fff" />
        <circle cx="300" cy="260" r="14" fill="#333" />
      </g>
      <path d="M230 300 Q256 320 282 300" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <g>
        <path d="M256 150 C 280 130, 320 100, 320 60 C 320 20, 280 0, 256 0 C 232 0, 192 20, 192 60 C 192 100, 232 130, 256 150 Z" fill="url(#flameGradient)">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
);

const TimeRobot = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="200" height="200" className="mx-auto">
      <defs>
        <linearGradient id="bodyGradientTime" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe" stopOpacity={1} />
          <stop offset="100%" stopColor="#00f2fe" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="metalGradientProfile" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0e0e0" stopOpacity={1} />
          <stop offset="100%" stopColor="#9e9e9e" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="screenGradientProfile" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#434343" stopOpacity={1} />
          <stop offset="100%" stopColor="#000000" stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d="M210,380 Q190,430 180,450" stroke="url(#metalGradientProfile)" strokeWidth="20" strokeLinecap="round" fill="none" />
      <path d="M302,380 Q322,430 332,450" stroke="url(#metalGradientProfile)" strokeWidth="20" strokeLinecap="round" fill="none" />
      <circle cx="256" cy="280" r="100" fill="url(#bodyGradientTime)" stroke="#fff" strokeWidth="4"/>
      <circle cx="256" cy="280" r="80" fill="#f9f9f9" />
      <g stroke="#333" strokeWidth="4" strokeLinecap="round">
        <line x1="256" y1="210" x2="256" y2="220" />
        <line x1="256" y1="340" x2="256" y2="350" />
      </g>
      <g transform="translate(256, 280)">
        <circle cx="0" cy="0" r="6" fill="#ff5252" />
        <path d="M0,0 L-20,-30" stroke="#333" strokeWidth="6" strokeLinecap="round" />
        <path d="M0,0 L40,0" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      </g>
      <rect x="176" y="60" width="160" height="120" rx="30" ry="30" fill="url(#bodyGradientTime)" stroke="#fff" strokeWidth="3"/>
      <rect x="196" y="80" width="120" height="80" rx="15" ry="15" fill="url(#screenGradientProfile)" />
      <path d="M236,140 Q256,150 276,140" stroke="#ccff00" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
);

const ProfileView: React.FC<ProfileViewProps> = ({ user, streak, library, onShowAuth, activity, onSignOut }) => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const totalReadingTimeHours = useMemo(() => {
        const seconds = library.reduce((acc, book) => acc + (book.readingTime || 0), 0);
        return (seconds / 3600).toFixed(1);
    }, [library]);

    const topGenres = useMemo(() => {
        const counts: Record<string, number> = {};
        library.forEach(b => {
            if (b.genre) {
                b.genre.split(',').forEach(g => {
                    const clean = g.trim().toLowerCase();
                    if (clean) counts[clean] = (counts[clean] || 0) + 1;
                });
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);
    }, [library]);

    useEffect(() => {
        const getRecs = async () => {
            if (library.length === 0 || recommendations.length > 0) return;
            
            setIsLoadingRecs(true);
            setError(null);
            
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                // We limit the number of titles to avoid context bloat
                const titles = library.slice(0, 5).map(b => b.title).join(', ');
                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: `User library contains: ${titles}. Based on these books, recommend 3 similar must-read titles. Return valid JSON only.`,
                    config: { 
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    author: { type: Type.STRING },
                                    coverUrl: { type: Type.NULL }
                                },
                                required: ["title", "author"]
                            }
                        }
                    }
                });
                
                const recs = safeJsonParse(response.text);
                setRecommendations(recs);
            } catch (e: any) {
                console.error("Recs failed", e);
                setError("Personalization engine currently unavailable. Please verify your connection.");
            } finally {
                setIsLoadingRecs(false);
            }
        };
        getRecs();
    }, [library]);

    if (!user) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-fade-in">
                <Box className="p-12 bg-[var(--color-surface)] border-8 border-[var(--color-border-color)] shadow-[16px_16px_0_var(--color-border-color)] w-full">
                    <h2 className="text-3xl font-black mb-6 uppercase text-[var(--color-primary-text)]">Private Library</h2>
                    <p className="text-[12px] text-[var(--color-muted-text)] mb-10 font-bold uppercase tracking-widest leading-relaxed">Sign in to sync your profile, though books remain local for privacy.</p>
                    <button onClick={onShowAuth} className="w-full py-5 bg-yellow-400 text-black border-4 border-black font-black uppercase shadow-[8px_8px_0_black] active:translate-y-1 transition-all text-xs rounded-none">Log In</button>
                </Box>
            </div>
        );
    }

    return (
        <div className="space-y-20 animate-fade-in max-w-5xl mx-auto pb-80 px-4 md:px-0">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-[var(--color-border-color)] pb-10">
                <Stack gap={0}>
                    <Text className="text-[10px] font-black uppercase tracking-[0.5em] text-pink-500 mb-2">The Archive of</Text>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-[var(--color-primary-text)]">{user.email.split('@')[0]}</h2>
                </Stack>
                <button onClick={onSignOut} className="mt-8 md:mt-0 bg-[var(--color-surface)] border-4 border-[var(--color-border-color)] px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] shadow-[6px_6px_0_var(--color-border-color)] hover:translate-y-[-2px] transition-all text-[var(--color-primary-text)] rounded-none">Sign Out</button>
            </header>

            <section className="flex flex-col md:flex-row items-center gap-12 bg-[var(--color-surface)] border-8 border-[var(--color-border-color)] p-8 md:p-16 shadow-[20px_20px_0_var(--color-border-color)] relative overflow-hidden">
                <div className="absolute top-4 left-4 text-[8px] font-black uppercase opacity-20 text-[var(--color-primary-text)]">Chapter I: The Chronometer</div>
                <div className="flex-1 space-y-6">
                    <h3 className="text-5xl font-black uppercase tracking-tighter leading-tight italic text-[var(--color-primary-text)]">Your time spent in other worlds.</h3>
                    <p className="text-lg font-serif italic text-[var(--color-secondary-text)] leading-relaxed">
                        In this journey, you have dedicated <span className="text-cyan-600 font-bold underline">{totalReadingTimeHours} hours</span> to the art of reading. Each minute was a step through history, a glance into another's mind.
                    </p>
                    <div className="pt-6">
                         <Box bg="var(--color-primary-text)" p="xs" className="inline-block px-8 py-4">
                             <Text className="text-4xl font-black text-[var(--color-background)]">{totalReadingTimeHours}h</Text>
                         </Box>
                    </div>
                </div>
                <div className="shrink-0">
                    <TimeRobot />
                </div>
            </section>

            <section className="flex flex-col md:flex-row-reverse items-center gap-12 bg-yellow-400 border-8 border-black p-8 md:p-16 shadow-[20px_20px_0_black] relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[8px] font-black uppercase opacity-20 text-black">Chapter II: The Flame</div>
                <div className="flex-1 space-y-6">
                    <h3 className="text-5xl font-black uppercase tracking-tighter leading-tight italic text-black">A flame that never fades.</h3>
                    <p className="text-lg font-serif italic text-black/90 leading-relaxed">
                        Consistency is the heartbeat of a scholar. You've maintained a <span className="bg-white px-2 font-bold text-black">{streak} day streak</span>, keeping the torch of curiosity burning bright across <span className="font-bold underline text-black">{library.length} books</span>.
                    </p>
                    <div className="pt-6">
                         <Box bg="white" p="xs" className="inline-block px-8 py-4 border-4 border-black shadow-[6px_6px_0_black]">
                             <Text className="text-4xl font-black text-black">{streak} Days</Text>
                         </Box>
                    </div>
                </div>
                <div className="shrink-0">
                    <StreakRobot />
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Box className="p-10 bg-[var(--color-surface)] border-8 border-[var(--color-border-color)] shadow-[16px_16px_0_var(--color-border-color)] relative overflow-hidden">
                    <div className="absolute top-4 left-4 text-[8px] font-black uppercase opacity-20 text-[var(--color-primary-text)]">Chapter III: The Map</div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 italic text-[var(--color-primary-text)]">The Path Traveled</h3>
                    <Text className="text-base font-serif italic mb-6 leading-relaxed text-[var(--color-secondary-text)]">Your curiosity often leads you through these realms:</Text>
                    <div className="flex flex-wrap gap-3">
                        {topGenres.map(genre => (
                            <Box key={genre} className="bg-pink-500 text-white px-4 py-2 border-4 border-black font-black uppercase text-[12px] shadow-[4px_4px_0_black]">
                                {genre}
                            </Box>
                        ))}
                        {topGenres.length === 0 && <Text className="opacity-40 italic text-[var(--color-primary-text)]">Exploring new territories...</Text>}
                    </div>
                </Box>

                <Box className="p-10 bg-[var(--color-primary-text)] border-8 border-black shadow-[16px_16px_0_pink] text-[var(--color-background)] relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-[8px] font-black uppercase opacity-20">Chapter IV: The Horizon</div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Next Horizons</h3>
                    <Text className="text-[11px] font-black uppercase mb-8 tracking-[0.4em] opacity-60">The future of your journey</Text>
                    
                    {isLoadingRecs ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <IconSpinner className="w-10 h-10 text-pink-500" />
                            <Text className="text-[10px] font-black uppercase">Scanning the stars...</Text>
                        </div>
                    ) : error ? (
                        <Box className="p-6 border-4 border-dashed border-white/20 text-center">
                            <Text className="text-[11px] font-black uppercase text-pink-400 mb-3">Service Notice</Text>
                            <Text className="text-[10px] opacity-70 leading-relaxed uppercase tracking-wider">{error}</Text>
                        </Box>
                    ) : (
                        <div className="space-y-4">
                            {recommendations.map((rec, i) => (
                                <Box key={i} className="bg-white border-4 border-black p-4 flex gap-4 items-center">
                                    <div className="w-10 h-14 bg-cyan-400 border-2 border-black flex items-center justify-center text-black font-black shrink-0">
                                        {rec.title.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Text className="text-[13px] font-black text-black uppercase truncate italic">{rec.title}</Text>
                                        <Text className="text-[10px] font-black text-pink-500 uppercase mt-1 truncate">{rec.author}</Text>
                                    </div>
                                </Box>
                            ))}
                            {recommendations.length === 0 && !isLoadingRecs && (
                                <Text className="text-center opacity-40 italic py-10 uppercase text-[9px] tracking-widest">Add more books to unlock insights</Text>
                            )}
                        </div>
                    )}
                </Box>
            </section>
        </div>
    );
};

export default ProfileView;
