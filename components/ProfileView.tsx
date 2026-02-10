
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

const StarshipIllustration = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 20L80 50L60 100L40 50L60 20Z" fill="#00D1FF" stroke="black" strokeWidth="6"/>
        <path d="M60 20L40 50H80L60 20Z" fill="#f0ff00" stroke="black" strokeWidth="6"/>
        <circle cx="60" cy="55" r="8" fill="white" stroke="black" strokeWidth="4"/>
        <path d="M40 70L20 90H100L80 70" stroke="black" strokeWidth="6"/>
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

    useEffect(() => {
        const getRecs = async () => {
            if (library.length === 0 || recommendations.length > 0) return;
            setIsLoadingRecs(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const titles = library.map(b => b.title).join(', ');
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: `Based on these books: ${titles}, suggest 3 book recommendations. 
                    Return as a JSON array: [{"title": "", "author": "", "coverUrl": null}]`,
                    config: { responseMimeType: 'application/json' }
                });
                
                const recs = JSON.parse(response.text);
                setRecommendations(recs);
            } catch (e) {
                console.error("Failed recommendations:", e);
            } finally {
                setIsLoadingRecs(false);
            }
        };
        getRecs();
    }, [library]);

    if (!user) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-fade-in">
                <Box className="p-12 bg-white border-8 border-black shadow-[16px_16px_0_black] w-full">
                    <StarshipIllustration />
                    <h2 className="text-3xl font-black mt-8 mb-6 uppercase tracking-tighter">Profile</h2>
                    <p className="text-[12px] text-gray-400 mb-10 leading-relaxed font-bold uppercase tracking-widest opacity-60">Log in to view your reading statistics.</p>
                    <button onClick={onShowAuth} className="w-full py-5 bg-yellow-400 text-black border-4 border-black font-black uppercase tracking-[0.2em] shadow-[8px_8px_0_black] active:translate-y-1 transition-all text-xs">Log In</button>
                </Box>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in max-w-6xl mx-auto pb-40">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-black pb-10">
                <div>
                    <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">Profile</h2>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-500">{user.email}</p>
                </div>
                <button onClick={onSignOut} className="mt-8 md:mt-0 bg-white border-4 border-black px-10 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-pink-500 shadow-[8px_8px_0_black] hover:translate-y-[-4px] transition-all">Log Out</button>
            </header>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
                <Box className="p-8 bg-white border-8 border-black shadow-[12px_12px_0_black]">
                    <Text className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6">Reading Time</Text>
                    <div className="flex items-baseline gap-4">
                        <Text className="text-7xl font-black text-black">{totalReadingTimeHours}</Text>
                        <Text className="text-xl font-black uppercase text-black">Hrs</Text>
                    </div>
                </Box>
                
                <Box className="p-8 bg-yellow-400 border-8 border-black shadow-[12px_12px_0_black]">
                    <Text className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 mb-6">Total Books</Text>
                    <div className="flex items-baseline gap-4">
                        <Text className="text-7xl font-black text-black">{library.length}</Text>
                        <Text className="text-xl font-black uppercase text-black">Books</Text>
                    </div>
                </Box>

                <Box className="p-8 bg-cyan-400 border-8 border-black shadow-[12px_12px_0_black]">
                    <Text className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 mb-6">Day Streak</Text>
                    <div className="flex items-baseline gap-4">
                        <Text className="text-7xl font-black text-black">{streak}</Text>
                        <Text className="text-xl font-black uppercase text-black">Days</Text>
                    </div>
                </Box>
            </SimpleGrid>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
                <Box className="p-10 bg-white border-8 border-black shadow-[16px_16px_0_black]">
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">Reading Stats</h3>
                    <div className="space-y-6">
                         {activity.slice(-5).map(a => (
                             <Group key={a.date} justify="space-between" className="border-b-4 border-slate-100 pb-2">
                                 <Text className="text-[14px] font-black uppercase text-black">{a.date}</Text>
                                 <Text className="text-[14px] font-black text-pink-500">{Math.round(a.seconds / 60)} Minutes</Text>
                             </Group>
                         ))}
                         {activity.length === 0 && <Text className="text-[14px] opacity-40 italic">Start reading to log your progress.</Text>}
                    </div>
                </Box>

                <Box className="p-10 bg-pink-500 border-8 border-black shadow-[16px_16px_0_black] text-white">
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Recommended</h3>
                    <Text className="text-[11px] font-black uppercase mb-8 tracking-[0.4em] opacity-80">Based on your library</Text>
                    
                    {isLoadingRecs ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <IconSpinner className="w-12 h-12 text-white" />
                            <Text className="text-[12px] font-black uppercase tracking-[0.3em]">Finding books...</Text>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {recommendations.map((rec, i) => (
                                <Box key={i} className="bg-white border-4 border-black p-4 shadow-[6px_6px_0_black] flex gap-4 items-center">
                                    <div className="w-12 h-16 bg-yellow-400 border-2 border-black flex items-center justify-center text-black font-black italic shrink-0">
                                        {rec.title.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Text className="text-[14px] font-black text-black uppercase truncate italic">{rec.title}</Text>
                                        <Text className="text-[11px] font-black text-pink-500 uppercase mt-1 tracking-widest truncate">{rec.author}</Text>
                                    </div>
                                </Box>
                            ))}
                            {recommendations.length === 0 && !isLoadingRecs && (
                                <Text className="text-center opacity-40 italic py-10 font-black uppercase tracking-widest text-[12px]">No recommendations available.</Text>
                            )}
                        </div>
                    )}
                </Box>
            </section>
        </div>
    );
};

export default ProfileView;
