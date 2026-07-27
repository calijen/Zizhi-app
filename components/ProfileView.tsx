import React, { useState, useMemo, useEffect } from 'react';
import { Box, Stack, Text } from '@mantine/core';
import type { BookMetadata, ReadingActivity } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { IconSpinner } from './icons';

interface ProfileViewProps {
  user: any;
  streak: number;
  library: BookMetadata[];
  onShowAuth: () => void;
  activity: ReadingActivity[];
  onSignOut: () => void;
}

interface Recommendation {
    title: string;
    author: string;
    reason: string;
    genre: string;
}

interface ProfileAIData {
    genres: string[];
    archetypeTitle: string;
    archetypeDesc: string;
    recommendations: Recommendation[];
}

/**
 * Utility to safely extract and parse JSON from an AI response string.
 * Handles cases where the AI wraps JSON in markdown blocks.
 */
const safeJsonParse = (text: string): ProfileAIData | null => {
    try {
        // Attempt 1: Direct parse
        return JSON.parse(text.trim());
    } catch (e) {
        // Attempt 2: Extract content between ```json and ```
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1].trim());
            } catch (e2) {
                console.error("Failed to parse extracted JSON block", e2);
            }
        }
        // Attempt 3: Try to find any curly brace structure
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            try {
                return JSON.parse(text.substring(firstBrace, lastBrace + 1));
            } catch (e3) {
                console.error("Failed to parse bracketed content", e3);
            }
        }
        return null;
    }
};

/**
 * Open Library Client-side Search to retrieve real book covers.
 */
const fetchOpenLibraryCover = async (title: string, author: string): Promise<string | null> => {
    try {
        // Core cleaning for robust searches
        const cleanTitle = title.replace(/\(.*?\)/g, "").trim();
        const cleanAuthor = author.replace(/by /i, "").replace(/\(.*?\)/g, "").trim();
        
        const res = await fetch(
            `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanTitle)}&author=${encodeURIComponent(cleanAuthor)}&limit=1`
        );
        if (!res.ok) return null;
        
        const data = await res.json();
        if (data.docs && data.docs.length > 0) {
            const firstDoc = data.docs[0];
            if (firstDoc.cover_i) {
                return `https://covers.openlibrary.org/b/id/${firstDoc.cover_i}-M.jpg`;
            }
        }
        return null;
    } catch (err) {
        console.error("Open Library cover look up failed:", err);
        return null;
    }
};

/**
 * Premium custom cover display component.
 * Performs async cover retrieval and serves balanced CSS color cards on failure.
 */
const BookCover: React.FC<{ title: string; author: string }> = ({ title, author }) => {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fallbackIndex = useMemo(() => {
        let sum = 0;
        for (let i = 0; i < title.length; i++) {
            sum += title.charCodeAt(i);
        }
        return sum % 5;
    }, [title]);

    const fallbackColors = [
        { bg: 'bg-cyan-500', text: 'text-black' },
        { bg: 'bg-yellow-400', text: 'text-black' },
        { bg: 'bg-pink-500', text: 'text-white' },
        { bg: 'bg-emerald-500', text: 'text-white' },
        { bg: 'bg-orange-500', text: 'text-white' }
    ];

    const currentColors = fallbackColors[fallbackIndex];

    useEffect(() => {
        let active = true;
        setLoading(true);
        fetchOpenLibraryCover(title, author).then(url => {
            if (active) {
                setCoverUrl(url);
                setLoading(false);
            }
        });
        return () => {
            active = false;
        };
    }, [title, author]);

    if (loading) {
        return (
            <div className="w-28 h-40 bg-slate-100 border-4 border-black flex items-center justify-center animate-pulse shrink-0">
                <IconSpinner className="w-6 h-6 text-pink-500" />
            </div>
        );
    }

    if (coverUrl) {
        return (
            <div className="w-28 h-40 border-4 border-black shadow-[4px_4px_0_black] shrink-0 overflow-hidden bg-white select-none">
                <img 
                    src={coverUrl} 
                    alt={title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                />
            </div>
        );
    }

    return (
        <div id="book-cover-fallback" className={`w-28 h-40 border-4 border-black shadow-[4px_4px_0_black] p-3 flex flex-col justify-between shrink-0 select-none ${currentColors.bg} ${currentColors.text} relative overflow-hidden`}>
            {/* Elegant spine indicator */}
            <div className="absolute top-0 left-0 w-2 h-full bg-black/10 border-r border-black/15" />
            <div className="pl-2 flex-1 flex flex-col justify-between h-full min-h-0 overflow-hidden">
                <div className="font-serif italic font-black text-[10px] leading-snug uppercase mt-1 break-words">
                    {title}
                </div>
                <div className="font-sans font-black tracking-widest text-[8px] opacity-80 uppercase leading-tight mb-1 break-words">
                    {author}
                </div>
            </div>
        </div>
    );
};

const StreakRobot = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="200" height="200" className="mx-auto select-none">
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="200" height="200" className="mx-auto select-none">
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
    // Unique cache key based on the specific books in the library
    const cacheKey = useMemo(() => {
        if (library.length === 0) return '';
        const ids = library.map(b => b.id || b.title).sort().join(',');
        return `zizhi-profile-analysis-${ids}`;
    }, [library]);

    // Fast synchronous cache retrieval for initial state loading (prevents flicker and unneeded API reloading)
    const getCachedData = (key: string): ProfileAIData | null => {
        if (!key) return null;
        try {
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    };

    const [aiData, setAiData] = useState<ProfileAIData | null>(() => getCachedData(cacheKey));
    const [recommendations, setRecommendations] = useState<Recommendation[]>(() => {
        const cached = getCachedData(cacheKey);
        return cached?.recommendations || [];
    });
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Synchronize state instantly if the cacheKey changes (e.g. from [] -> loaded books, or when a new book is uploaded)
    useEffect(() => {
        if (!cacheKey) {
            setAiData(null);
            setRecommendations([]);
            return;
        }
        const cached = getCachedData(cacheKey);
        if (cached) {
            setAiData(cached);
            setRecommendations(cached.recommendations || []);
        } else {
            setAiData(null);
            setRecommendations([]);
        }
    }, [cacheKey]);
    
    const totalReadingTimeHours = useMemo(() => {
        const seconds = library.reduce((acc, book) => acc + (book.readingTime || 0), 0);
        return (seconds / 3600).toFixed(1);
    }, [library]);

    // Robust Local Top Genres extraction to handle offline fallback or latency safely.
    const topGenresOffline = useMemo(() => {
        const counts: Record<string, number> = {};
        library.forEach(b => {
            if (b.genre) {
                (b.genre || '').split(',').forEach(g => {
                    const clean = g.trim().replace(/^pdf document$/i, '').trim();
                    if (clean && clean.toLowerCase() !== "unknown" && clean.toLowerCase() !== "epub" && clean.toLowerCase() !== "pdf") {
                        const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
                        counts[capitalized] = (counts[capitalized] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name]) => name);
    }, [library]);

    const displayedGenres = useMemo(() => {
        if (aiData?.genres && aiData.genres.length > 0) {
            return aiData.genres;
        }
        return topGenresOffline;
    }, [aiData, topGenresOffline]);

    useEffect(() => {
        const getProfileAnalysis = async () => {
            if (library.length === 0 || !cacheKey) return;
            
            // Check cache first to optimize key usage & prevent loading flicker / Gemini API calls
            const cached = getCachedData(cacheKey);
            if (cached) {
                // Content is already synchronized correctly. Just exit!
                return;
            }
            
            setIsLoadingRecs(true);
            setError(null);
            
            try {
                // Ensure proper instantiating format
                const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");
                const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
                
                // Represent library items to Gemini clearly
                const bookBriefs = library
                    .slice(0, 10)
                    .map(b => `"${b.title}" by ${b.author} (original category: ${b.genre || 'None'})`)
                    .join('\n');
                
                const prompt = `
You are a highly perceptive literary archivist and librarian for the Zizhi Scholar’s Academy.
Analyze the user's current reading library.
The library contains the following books:
${bookBriefs}

Based on these books, determine their true academic study interests to expand their horizons.

Task 1: Determine the user's top 3-4 literary or scientific study domains/genres (e.g. "Philosophy", "Political Science", "Classic Fiction", "Post-Modernism", "Existentialism", "Theoretical Physics", "History", etc.). Avoid generic tags like "PDF Document", "Epub", "Textbook".
Task 2: Evaluate their overall reading mix and profile them with a witty, profound personal "Scholarly Archetype" (e.g., "The Existential Explorer", "The Scientific Realist", "The Classical Humanist", "The Speculative Thinker") with a 1-sentence description that celebrates their intellectual journey.
Task 3: Curate exactly 6 recommended readings. For each, give its title, author, its primary genre, and a profound 1-sentence explanation of why it will expand their specific horizon based on what they are already reading.

You must return a valid JSON object ONLY. Do not output any thinking block, comments, or surrounding markdown blocks (such as \`\`\`json). The JSON must conform strictly to this structure:
{
  "genres": ["Philosophy", "Existentialism", "Classic Fiction"], 
  "archetypeTitle": "The Existential Explorer",
  "archetypeDesc": "You seek fundamental truths of humans, traversing paths of ontological enquiry and classical human ethics.",
  "recommendations": [
    {
      "title": "Thus Spoke Zarathustra",
      "author": "Friedrich Nietzsche",
      "reason": "Expands on existential and philosophical questions raised in your reading of classics.",
      "genre": "Philosophy"
    }
  ]
}
`;
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                
                const aiResult = safeJsonParse(text);
                if (aiResult) {
                    setAiData(aiResult);
                    setRecommendations(aiResult.recommendations || []);
                    if (cacheKey) {
                        localStorage.setItem(cacheKey, JSON.stringify(aiResult));
                    }
                } else {
                    throw new Error("Invalid json format returned from AI model");
                }
            } catch (e: any) {
                console.error("Profile optimization failed", e);
                setError("The personalization engine is off duty. Relying on local archives.");
                // Setup reasonable placeholder recommendations on failure so screen remains gorgeous
                setRecommendations([
                    { title: "Beyond Good and Evil", author: "Friedrich Nietzsche", reason: "Unpacks moral values and perspectives crucial to analytical thinking.", genre: "Philosophy" },
                    { title: "Sapiens", author: "Yuval Noah Harari", reason: "An expansive look at humanity’s path matching your scientific journey.", genre: "Anthropology" },
                    { title: "Moby Dick", author: "Herman Melville", reason: "A spectacular epic that tests the limits of systemic query and nature.", genre: "Classic Fiction" }
                ]);
            } finally {
                setIsLoadingRecs(false);
            }
        };
        getProfileAnalysis();
    }, [cacheKey]);

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
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-[var(--color-primary-text)]">{(user?.email || '').split('@')[0] || user?.displayName || 'Reader'}</h2>
                </Stack>
                <button onClick={onSignOut} className="mt-8 md:mt-0 bg-[var(--color-surface)] border-4 border-[var(--color-border-color)] px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] shadow-[6px_6px_0_var(--color-border-color)] hover:translate-y-[-2px] transition-all text-[var(--color-primary-text)] rounded-none">Sign Out</button>
            </header>

            {/* Chapter I */}
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

            {/* Chapter II */}
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

            {/* Chapter III */}
            <section className="bg-[var(--color-surface)] border-8 border-[var(--color-border-color)] p-8 md:p-16 shadow-[20px_20px_0_var(--color-border-color)] relative overflow-hidden">
                <div className="absolute top-4 left-4 text-[8px] font-black uppercase opacity-20 text-[var(--color-primary-text)]">Chapter III: The Map</div>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <h3 className="text-[28px] md:text-3xl font-black uppercase tracking-tighter italic text-[var(--color-primary-text)]">The Path Traveled</h3>
                        <p className="text-sm font-serif italic text-[var(--color-secondary-text)] leading-relaxed">
                            Your scholarly inquiry maps onto these specific study domains.
                        </p>
                    </div>

                    {/* Scholarly Archetype Display (Premium addition) */}
                    {aiData?.archetypeTitle && (
                        <div className="p-6 bg-pink-100/80 border-4 border-black shadow-[4px_4px_0_black] text-black space-y-2">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-pink-600 block">Scholarly Archetype</span>
                            <h4 className="text-xl font-black uppercase tracking-tight italic">{aiData.archetypeTitle}</h4>
                            <p className="font-serif italic text-xs text-black/80 leading-relaxed">{aiData.archetypeDesc}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                         <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted-text)] block">Primary study topics:</span>
                         <div className="flex flex-wrap gap-3">
                             {displayedGenres.map(genre => (
                                 <Box key={genre} className="bg-pink-500 text-white px-4 py-2 border-4 border-black font-black uppercase text-[11px] shadow-[3px_3px_0_black]">
                                     {genre}
                                 </Box>
                             ))}
                             {displayedGenres.length === 0 && (
                                 <Text className="opacity-40 italic text-[var(--color-primary-text)]">Exploring initial pathways...</Text>
                             )}
                         </div>
                    </div>
                </div>
            </section>

            {/* Chapter IV: Next Horizons — Full-Width Shelf display to accumulate a larger number of books */}
            <section className="bg-[var(--color-primary-text)] border-8 border-black p-8 md:p-16 shadow-[20px_20px_0_pink] text-[var(--color-background)] relative overflow-hidden">
                <div className="absolute top-4 left-4 text-[8px] font-black uppercase opacity-20">Chapter IV: The Horizon</div>
                
                <div className="space-y-4 mb-12">
                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Next Horizons</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-400">Curated recommendations supporting your intellectual compass</p>
                </div>

                {isLoadingRecs ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <IconSpinner className="w-12 h-12 text-pink-500 animate-spin" />
                        <Text className="text-[11px] font-black uppercase tracking-widest">Studying book charts...</Text>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        {recommendations.map((rec, i) => (
                            <div 
                                key={i} 
                                className="bg-white border-4 border-black p-5 sm:p-6 flex flex-row gap-5 text-black shadow-[6px_6px_0_pink] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_pink] transition-all duration-300 h-full items-start"
                            >
                                <div className="shrink-0">
                                    <BookCover title={rec.title} author={rec.author} />
                                </div>
                                <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5 space-y-3 h-full">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-900 px-2.5 py-1 border border-cyan-400 font-sans inline-block">
                                                {rec.genre || "Essential study"}
                                            </span>
                                        </div>
                                        <h4 className="text-base sm:text-lg font-black uppercase italic leading-snug break-words text-black">
                                            {rec.title}
                                        </h4>
                                        <p className="text-xs font-black text-pink-600 uppercase tracking-wide break-words">
                                            by {rec.author}
                                        </p>
                                    </div>
                                    <p className="font-serif italic text-xs text-black/80 leading-relaxed border-t-2 border-black/10 pt-3 mt-1 break-words">
                                        {rec.reason || `Essential expansion for your library.`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {recommendations.length === 0 && !isLoadingRecs && (
                    <div className="py-16 text-center max-w-md mx-auto space-y-4">
                        <p className="text-sm font-serif italic opacity-60">
                            "The library is a sphere whose exact center is any one of its hexagons and whose circumference is inaccessible."
                        </p>
                        <Text className="text-[11px] font-black uppercase tracking-[0.3em] text-pink-400">
                            Populate your library to activate the oracle
                        </Text>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProfileView;
