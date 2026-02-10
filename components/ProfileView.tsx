
import React, { useState, useMemo, useEffect } from 'react';
import { Box, Group, Stack, Text, SimpleGrid, Image } from '@mantine/core';
import type { Book, ReadingActivity } from '../types';
import { GoogleGenAI } from "@google/genai";
import { IconLibrary, IconSpinner } from './icons';

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

const ComicHeroSVG = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="80" height="70" rx="8" fill="#f0ff00" stroke="black" strokeWidth="4"/>
        <circle cx="45" cy="55" r="8" fill="white" stroke="black" strokeWidth="3"/>
        <circle cx="75" cy="55" r="8" fill="white" stroke="black" strokeWidth="3"/>
        <circle cx="47" cy="53" r="3" fill="black"/>
        <circle cx="77" cy="53" r="3" fill="black"/>
        <path d="M40 80C40 80 50 90 60 90C70 90 80 80 80 80" stroke="black" strokeWidth="4" strokeLinecap="round"/>
        <path d="M60 10V30" stroke="black" strokeWidth="4"/>
        <path d="M50 15L60 30L70 15" stroke="black" strokeWidth="4"/>
    </svg>
);

const TrophyRoomSVG = () => (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 30H70V50C70 61.0457 61.0457 70 50 70C38.9543 70 30 61.0457 30 50V30Z" fill="#ff007a" stroke="black" strokeWidth="4"/>
        <path d="M30 40H20V50C20 55.5228 24.4772 60 30 60" stroke="black" strokeWidth="4"/>
        <path d="M70 40H80V50C80 55.5228 75.5228 60 70 60" stroke="black" strokeWidth="4"/>
        <rect x="40" y="70" width="20" height="15" fill="black"/>
        <rect x="30" y="85" width="40" height="5" fill="black"/>
    </svg>
);

const ProfileView: React.FC<ProfileViewProps> = ({ user, streak, library, onShowAuth, activity, onSignOut }) => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    
    const totalReadingTimeHours = useMemo(() => {
        const seconds = library.reduce((acc, book) => acc + (book.readingTime || 0), 0);
        return (seconds / 3600).toFixed(1);
    }, [library]);

    const booksCompleted = useMemo(() => {
        return library.filter(b => b.progress >= 0.99).length;
    }, [library]);

    const genreStats = useMemo(() => {
        const stats: Record<string, number> = {};
        library.forEach(book => {
            if (book.genre) {
                const genres = book.genre.split(/[,;]/).map(g => g.trim());
                genres.forEach(g => {
                    if (g && g.length > 2) {
                        const key = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
                        stats[key] = (stats[key] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [library]);

    useEffect(() => {
        const getRecs = async () => {
            if (library.length === 0 || recommendations.length > 0) return;
            setIsLoadingRecs(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const titles = library.map(b => b.title).join(', ');
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: `Based on these books: ${titles}, suggest 3 distinct book recommendations. 
                    For each book, perform a Google Search to find its most recognizable cover image URL.
                    Return as a JSON array: [{"title": "", "author": "", "coverUrl": ""}]`,
                    config: {
                        tools: [{ googleSearch: {} }],
                        responseMimeType: 'application/json'
                    }
                });
                
                const recs = JSON.parse(response.text);
                setRecommendations(recs);
            } catch (e) {
                console.error("Failed recommendations:", e);
                // Fallback to text-only if JSON fails
                setRecommendations([
                    { title: "The Sovereign Individual", author: "James Dale Davidson", coverUrl: null },
                    { title: "Gödel, Escher, Bach", author: "Douglas Hofstadter", coverUrl: null },
                    { title: "Antifragile", author: "Nassim Taleb", coverUrl: null }
                ]);
            } finally {
                setIsLoadingRecs(false);
            }
        };
        getRecs();
    }, [library]);

    if (!user) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-fade-in">
                <Box className="p-10 bg-white border-8 border-black shadow-[12px_12px_0_black] w-full">
                    <div className="flex justify-center mb-6 animate-bounce"><ComicHeroSVG /></div>
                    <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Enter the Vault</h2>
                    <p className="text-[12px] text-gray-400 mb-8 leading-relaxed font-bold uppercase tracking-tight opacity-60">Sign in to sync your comic-book archive and level up your stats!</p>
                    <button onClick={onShowAuth} className="w-full py-4 bg-yellow-400 text-black border-4 border-black font-black uppercase tracking-widest shadow-[6px_6px_0_black] active:translate-y-1 active:shadow-none transition-all">SIGN IN</button>
                </Box>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-fade-in max-w-5xl mx-auto pb-40">
            <header className="flex justify-between items-center border-b-8 border-black pb-6 relative">
                <div className="absolute -top-4 -left-2 rotate-[-5deg] bg-yellow-400 border-4 border-black px-6 py-1 shadow-[4px_4px_0_black] z-10">
                    <Text className="text-xs font-black uppercase tracking-widest text-black">SUCCESS: CONNECTED</Text>
                </div>
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Mission Control</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mt-1">{user.email}</p>
                </div>
                <button onClick={onSignOut} className="bg-white border-4 border-black px-6 py-3 text-[12px] font-black uppercase tracking-widest text-pink-500 shadow-[6px_6px_0_black] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_black] active:translate-y-[2px] active:shadow-none transition-all">Sign Out</button>
            </header>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
                <Box className="p-6 bg-white border-8 border-black shadow-[10px_10px_0_black] relative overflow-hidden group">
                    <Text className="text-[10px] font-black uppercase text-gray-400 mb-2">XP: TIME INVESTED</Text>
                    <div className="flex items-baseline gap-2">
                        <Text className="text-7xl font-black text-black tabular-nums">{totalReadingTimeHours}</Text>
                        <Text className="text-xl font-black uppercase text-black">Hrs</Text>
                    </div>
                    <div className="mt-4 flex justify-center group-hover:rotate-12 transition-transform"><ComicHeroSVG /></div>
                </Box>
                
                <Box className="p-6 bg-yellow-400 border-8 border-black shadow-[10px_10px_0_black] relative overflow-hidden">
                    <Text className="text-[10px] font-black uppercase text-black mb-2 opacity-60">ARCHIVE DATA</Text>
                    <div className="flex items-baseline gap-2">
                        <Text className="text-7xl font-black text-black tabular-nums">{library.length}</Text>
                        <Text className="text-xl font-black uppercase text-black">Files</Text>
                    </div>
                    <div className="mt-4 border-t-4 border-black pt-4">
                        <Text className="text-[11px] font-black uppercase text-black">{booksCompleted} COMPLETED MISSIONS</Text>
                        <div className="h-6 bg-white border-4 border-black mt-2">
                            <div className="h-full bg-pink-500" style={{ width: `${(booksCompleted / (library.length || 1)) * 100}%` }} />
                        </div>
                    </div>
                </Box>

                <Box className="p-6 bg-cyan-400 border-8 border-black shadow-[10px_10px_0_black] relative overflow-hidden">
                    <Text className="text-[10px] font-black uppercase text-black mb-2 opacity-60">STREAK MULTIPLIER</Text>
                    <div className="flex items-baseline gap-2">
                        <Text className="text-7xl font-black text-black tabular-nums">{streak}</Text>
                        <Text className="text-xl font-black uppercase text-black">Days</Text>
                    </div>
                    <div className="mt-4 flex justify-center scale-125 animate-pulse"><TrophyRoomSVG /></div>
                </Box>
            </SimpleGrid>

            <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <Box className="md:col-span-6 p-8 bg-white border-8 border-black shadow-[12px_12px_0_black]">
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-4">
                        <span className="w-12 h-12 bg-black text-white flex items-center justify-center text-2xl">R</span>
                        Archive Focus
                    </h3>
                    {genreStats.length > 0 ? (
                        <div className="space-y-6">
                            {genreStats.map(([genre, count], i) => (
                                <div key={genre}>
                                    <Group justify="space-between" mb={2}>
                                        <Text className="text-[14px] font-black uppercase">{genre}</Text>
                                        <Text className="text-[10px] font-black text-gray-400">{count} FILES</Text>
                                    </Group>
                                    <div className="h-8 bg-gray-100 border-4 border-black relative">
                                        <div 
                                            className={`h-full border-r-4 border-black ${['bg-pink-500', 'bg-yellow-400', 'bg-cyan-400', 'bg-green-400', 'bg-indigo-400'][i % 5]}`} 
                                            style={{ width: `${(count / library.length) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center opacity-30">
                            <IconLibrary className="w-16 h-16 mb-4" />
                            <p className="text-[12px] font-black uppercase text-center">NO MISSION DATA DETECTED</p>
                        </div>
                    )}
                </Box>

                <Box className="md:col-span-6 p-8 bg-pink-500 border-8 border-black shadow-[12px_12px_0_black] text-white">
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-4">
                        <span className="w-12 h-12 bg-white text-pink-500 flex items-center justify-center text-2xl">D</span>
                        Discovery Hub
                    </h3>
                    <Text className="text-[10px] font-black uppercase mb-10 opacity-70">Synthesized by Core AI</Text>
                    
                    {isLoadingRecs ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <IconSpinner className="w-12 h-12 text-white" />
                            <Text className="text-[12px] font-black uppercase animate-pulse">Scanning Multiverse...</Text>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {recommendations.map((rec, i) => (
                                <div key={i} className="bg-white border-4 border-black p-4 shadow-[6px_6px_0_black] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_black] transition-all group">
                                    <Stack gap="sm">
                                        <Box className="aspect-[2/3] bg-slate-100 border-4 border-black shadow-[4px_4px_0_black] overflow-hidden relative">
                                            {rec.coverUrl ? (
                                                <Image src={rec.coverUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-yellow-400 text-black font-black text-4xl">
                                                    {rec.title.charAt(0)}
                                                </div>
                                            )}
                                        </Box>
                                        <div className="min-w-0">
                                            <Text className="text-[13px] font-black text-black uppercase leading-tight line-clamp-2">{rec.title}</Text>
                                            <Text className="text-[10px] font-black text-pink-500 uppercase mt-1 truncate">{rec.author}</Text>
                                        </div>
                                    </Stack>
                                </div>
                            ))}
                        </div>
                    )}
                </Box>
            </section>
        </div>
    );
};

export default ProfileView;
