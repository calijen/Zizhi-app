
import React from 'react';
import { Box, SimpleGrid, Stack, Text, Image, Group, Progress, ActionIcon, Button } from '@mantine/core';
import { IconClose, IconSpinner, IconLibrary } from './icons';
import type { GenerationStatus, Theme } from '../types';

export interface BookCardData {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  progress: number;
  audioSummaryUrl?: string;
  summaryScript?: string;
}

interface LibraryProps {
  books: BookCardData[];
  theme: Theme;
  onBookSelect: (bookId: string) => void;
  isLoading: boolean;
  error: string | null;
  onDelete: (bookId: string) => void;
  onGenerateSummary: (bookId: string) => void;
  generationStatuses: Record<string, GenerationStatus>;
  onViewSummary: (bookId: string) => void;
  viewMode: 'grid' | 'list';
}

const CartoonRobotIllustration = () => (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-bounce-slow">
        <rect x="70" y="80" width="100" height="80" rx="12" fill="#00D1FF" stroke="black" strokeWidth="8" />
        <rect x="85" y="105" width="20" height="20" rx="10" fill="white" stroke="black" strokeWidth="4" />
        <rect x="135" y="105" width="20" height="20" rx="10" fill="white" stroke="black" strokeWidth="4" />
        <path d="M100 145C110 150 130 150 140 145" stroke="black" strokeWidth="4" strokeLinecap="round" />
        <rect x="110" y="60" width="20" height="20" fill="#FF007A" stroke="black" strokeWidth="4" />
        <path d="M120 40V60" stroke="black" strokeWidth="6" strokeLinecap="round" />
        <circle cx="120" cy="30" r="10" fill="#f0ff00" stroke="black" strokeWidth="4" />
    </svg>
);

const BookCard: React.FC<{ 
    book: BookCardData; 
    theme: Theme;
    onSelect: (id: string) => void; 
    onDelete: (id: string) => void;
    onViewSummary: (id: string) => void;
    onGenerateSummary: (id: string) => void;
    generationStatus?: GenerationStatus;
    viewMode: 'grid' | 'list';
}> = ({ book, theme, onSelect, onDelete, onViewSummary, onGenerateSummary, generationStatus, viewMode }) => {
    const isList = viewMode === 'list';
    const hasSummary = !!book.audioSummaryUrl;
    const isGenerating = !!generationStatus;
    const progressPercent = Math.round((book.progress || 0) * 100);

    return (
        <Box 
            bg="var(--color-surface)"
            className={`relative group border-4 border-[var(--color-border-color)] shadow-[6px_6px_0px_var(--color-border-color)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_var(--color-border-color)] transition-all overflow-hidden`}
        >
            <Box className={`${isList ? 'flex flex-row h-52' : 'flex flex-col'}`}>
                <Box 
                    className={`relative cursor-pointer overflow-hidden ${isList ? 'w-36 flex-shrink-0 border-r-4 border-[var(--color-border-color)]' : 'aspect-[3/4] border-b-4 border-[var(--color-border-color)]'}`}
                    onClick={() => onSelect(book.id)}
                >
                    {book.coverImageUrl ? (
                        <Image src={book.coverImageUrl} className="w-full h-full object-cover" />
                    ) : (
                        <Box className="w-full h-full bg-slate-100 flex items-center justify-center font-black text-slate-400">NO COVER</Box>
                    )}
                </Box>

                <Stack p="md" gap="xs" className="flex-1 justify-between min-w-0">
                    <Stack gap={2}>
                        <Group justify="space-between" align="start" wrap="nowrap">
                            <Text className="font-black text-[16px] leading-tight truncate text-[var(--color-primary-text)] uppercase" title={book.title}>{book.title}</Text>
                            <ActionIcon variant="filled" color="red" size="sm" className="border-2 border-black shadow-[2px_2px_0_black]" onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}>
                                <IconClose className="w-4 h-4 text-white" />
                            </ActionIcon>
                        </Group>
                        <Text className="text-[10px] font-bold text-[var(--color-secondary-text)] truncate uppercase tracking-widest">{book.author}</Text>
                    </Stack>

                    <Stack gap={6}>
                        <Group justify="space-between" align="center">
                             <Text className="text-[9px] font-black uppercase text-[var(--color-muted-text)]">Reading Progress</Text>
                             <Text className="text-[11px] font-black text-black">{progressPercent}%</Text>
                        </Group>
                        <Progress value={progressPercent} size="xl" radius={0} color="var(--color-primary-text)" className="border-2 border-[var(--color-border-color)] h-5 bg-transparent" />
                        <Group gap={4} wrap="nowrap">
                            <Button 
                                variant="filled" 
                                color="cyan" 
                                className="flex-1 border-2 border-black rounded-none shadow-[2px_2px_0_#000] h-10 p-0 text-[11px] font-black uppercase text-black"
                                onClick={() => onSelect(book.id)}
                            >
                                {book.progress > 0 ? 'Continue' : 'Start'}
                            </Button>
                            <Button 
                                variant="filled" 
                                color={hasSummary ? "pink" : "yellow"} 
                                className="flex-1 border-2 border-black rounded-none shadow-[2px_2px_0_#000] h-10 p-0 text-[11px] font-black uppercase text-black flex items-center justify-center gap-2"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (hasSummary) onViewSummary(book.id);
                                    else onGenerateSummary(book.id);
                                }}
                                loading={isGenerating}
                            >
                                {isGenerating ? "Syncing" : (hasSummary ? "Listen" : "Summarize")}
                            </Button>
                        </Group>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
};

const Library: React.FC<LibraryProps> = ({ books, theme, onBookSelect, isLoading, onDelete, onViewSummary, onGenerateSummary, generationStatuses, viewMode }) => {
  return (
    <Box className="py-4 md:py-8 animate-fade-in">
        <header className="mb-10 flex justify-between items-end border-b-4 border-[var(--color-border-color)] pb-6">
            <div>
                <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted-text)] mb-1">Library</Text>
                <h2 className="text-2xl md:text-4xl font-black text-[var(--color-primary-text)] uppercase">{books.length} Books</h2>
            </div>
        </header>

        {isLoading && (
            <Box className="bg-[var(--color-surface)] border-4 border-[var(--color-border-color)] p-20 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_var(--color-border-color)] animate-pulse">
                <IconSpinner className="w-12 h-12 text-[var(--color-primary)] mb-6" />
                <Text className="text-[13px] font-black uppercase tracking-[0.2em] text-[var(--color-primary-text)]">Parsing EPUB...</Text>
            </Box>
        )}
        
        {!isLoading && books.length === 0 && (
            <Box className="py-24 flex flex-col items-center justify-center text-center">
                <CartoonRobotIllustration />
                <h2 className="text-3xl font-black mt-10 uppercase tracking-tighter">Your Library is Empty</h2>
                <p className="text-[12px] font-bold opacity-60 mt-2 uppercase tracking-[0.1em] text-black">Upload a book to start reading.</p>
            </Box>
        )}

        <SimpleGrid cols={viewMode === 'list' ? 1 : { base: 2, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="xl">
            {books.map(book => (
                <BookCard 
                    key={book.id} 
                    book={book} 
                    theme={theme}
                    onSelect={onBookSelect} 
                    onDelete={onDelete} 
                    onViewSummary={onViewSummary}
                    onGenerateSummary={onGenerateSummary}
                    generationStatus={generationStatuses[book.id]}
                    viewMode={viewMode} 
                />
            ))}
        </SimpleGrid>
        
        <style>{`
            @keyframes bounce-slow {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            .animate-bounce-slow {
                animation: bounce-slow 4s infinite ease-in-out;
            }
        `}</style>
    </Box>
  );
};

export default Library;
