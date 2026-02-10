
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

const CartoonRobotSVG = () => (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="70" y="80" width="100" height="80" rx="10" fill="#00D1FF" stroke="currentColor" strokeWidth="6" />
        <rect x="85" y="100" width="20" height="20" rx="10" fill="white" stroke="currentColor" strokeWidth="4" />
        <rect x="135" y="100" width="20" height="20" rx="10" fill="white" stroke="currentColor" strokeWidth="4" />
        <path d="M100 140Q120 150 140 140" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <rect x="110" y="60" width="20" height="20" fill="#FF007A" stroke="currentColor" strokeWidth="4" />
        <path d="M120 40V60" stroke="currentColor" strokeWidth="4" />
        <rect x="60" y="110" width="10" height="30" fill="currentColor" />
        <rect x="170" y="110" width="10" height="30" fill="currentColor" />
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
            <Box className={`${isList ? 'flex flex-row h-48' : 'flex flex-col'}`}>
                <Box 
                    className={`relative cursor-pointer overflow-hidden ${isList ? 'w-32 flex-shrink-0 border-r-4 border-[var(--color-border-color)]' : 'aspect-[3/4] border-b-4 border-[var(--color-border-color)]'}`}
                    onClick={() => onSelect(book.id)}
                >
                    {book.coverImageUrl ? (
                        <Image src={book.coverImageUrl} className="w-full h-full object-cover" />
                    ) : (
                        <Box className="w-full h-full bg-slate-100 flex items-center justify-center"><IconLibrary className="w-12 h-12 text-slate-300" /></Box>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-300 border-2 border-black text-[10px] font-black text-black">
                        {progressPercent}%
                    </div>
                </Box>

                <Stack p="md" gap="xs" className="flex-1 justify-between min-w-0">
                    <Stack gap={2}>
                        <Group justify="space-between" align="start" wrap="nowrap">
                            <Text className="font-black text-[14px] leading-tight truncate text-[var(--color-primary-text)] uppercase" title={book.title}>{book.title}</Text>
                            <ActionIcon variant="subtle" color="red" size="sm" className="opacity-40 hover:opacity-100" onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}>
                                <IconClose className="w-4 h-4" />
                            </ActionIcon>
                        </Group>
                        <Text className="text-[10px] font-bold text-[var(--color-secondary-text)] truncate uppercase tracking-widest">{book.author}</Text>
                    </Stack>

                    <Stack gap={6}>
                        <Group justify="space-between" align="center">
                             <Text className="text-[8px] font-black uppercase text-[var(--color-muted-text)]">{progressPercent}% read</Text>
                        </Group>
                        <Progress value={progressPercent} size="xl" radius={0} color="var(--color-primary-text)" className="border-2 border-[var(--color-border-color)] h-4 bg-transparent" />
                        <Group gap={4} wrap="nowrap">
                            <Button 
                                variant="filled" 
                                color="cyan" 
                                className="flex-1 border-2 border-black rounded-none shadow-[2px_2px_0_#000] h-10 p-0 text-[11px] font-black uppercase text-black"
                                onClick={() => onSelect(book.id)}
                            >
                                {book.progress > 0 ? 'CONTINUE' : 'START'}
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
                                {isGenerating ? "SYNCING" : (hasSummary ? "LISTEN" : "SUMMARIZE")}
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
    <Box className="py-8 animate-fade-in">
        <header className="mb-8 flex justify-between items-end border-b-2 border-[var(--color-border-color)] pb-4">
            <div>
                <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted-text)]">Mission Logs</Text>
                <Text className="text-xl md:text-3xl font-black text-[var(--color-primary-text)] uppercase">{books.length} Archives Loaded</Text>
            </div>
        </header>

        {isLoading && (
            <Box className="bg-[var(--color-surface)] border-4 border-[var(--color-border-color)] p-20 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_var(--color-border-color)]">
                <IconSpinner className="w-10 h-10 text-[var(--color-primary)] mb-4" />
                <Text className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--color-primary-text)]">Parsing Multiverse Data...</Text>
            </Box>
        )}
        
        {!isLoading && books.length === 0 && (
            <Box className="py-24 flex flex-col items-center justify-center text-center text-[var(--color-primary-text)]">
                <CartoonRobotSVG />
                <h2 className="text-3xl font-black mt-8 uppercase tracking-tighter">Monolith is empty</h2>
                <p className="text-[12px] font-bold opacity-60 mt-2 uppercase tracking-[0.1em]">Upload an archive to begin link.</p>
            </Box>
        )}

        <SimpleGrid cols={viewMode === 'list' ? 1 : { base: 2, sm: 3, lg: 4, xl: 5 }} spacing="xl">
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
    </Box>
  );
};

export default Library;
