
import { FC } from 'react';
import { Box, SimpleGrid, Stack, Text, Image, Group, Progress, ActionIcon, Button } from '@mantine/core';
import { IconClose, IconSpinner, IconPlay } from './icons';
import type { GenerationStatus, Theme, BookMetadata } from '../types';

interface LibraryProps {
  books: BookMetadata[];
  theme: Theme;
  onBookSelect: (bookId: string) => void;
  isLoading: boolean;
  error: string | null;
  onDelete: (bookId: string) => void;
  onGenerateSummary: (bookId: string) => void;
  generationStatuses: Record<string, GenerationStatus>;
  onViewSummary: (bookId: string) => void;
  viewMode: 'grid' | 'list';
  isCloudSynced?: boolean;
}

const EmptyLibraryGraphic = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="300" height="300" className="mx-auto mb-4">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0f4f8" stopOpacity={1} />
          <stop offset="100%" stopColor="#dfe6e9" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="metalBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#63cdda" stopOpacity={1} />
          <stop offset="100%" stopColor="#3dc1d3" stopOpacity={1} />
        </linearGradient>
        <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffeaa7" stopOpacity={1} />
          <stop offset="80%" stopColor="#fdcb6e" stopOpacity={1} />
          <stop offset="100%" stopColor="#e17055" stopOpacity={1} />
        </radialGradient>
        <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff7675" stopOpacity={1} />
          <stop offset="100%" stopColor="#d63031" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="512" height="512" fill="url(#bgGrad)" />
      <g opacity="0.4">
        <rect x="40" y="80" width="120" height="300" rx="5" fill="#b2bec3" />
        <rect x="50" y="90" width="100" height="280" fill="#dfe6e9" />
        <line x1="50" y1="160" x2="150" y2="160" stroke="#b2bec3" strokeWidth="4" />
        <line x1="50" y1="230" x2="150" y2="230" stroke="#b2bec3" strokeWidth="4" />
        <line x1="50" y1="300" x2="150" y2="300" stroke="#b2bec3" strokeWidth="4" />
        <rect x="350" y="80" width="120" height="300" rx="5" fill="#b2bec3" />
        <rect x="360" y="90" width="100" height="280" fill="#dfe6e9" />
        <line x1="360" y1="160" x2="460" y2="160" stroke="#b2bec3" strokeWidth="4" />
        <line x1="360" y1="230" x2="460" y2="230" stroke="#b2bec3" strokeWidth="4" />
        <line x1="360" y1="300" x2="460" y2="300" stroke="#b2bec3" strokeWidth="4" />
      </g>
      <ellipse cx="256" cy="430" rx="140" ry="30" fill="#636e72" opacity="0.2" />
      <g transform="translate(0, 20)">
        <path d="M200,380 Q180,420 160,420" stroke="#2d3436" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <path d="M312,380 Q332,420 352,420" stroke="#2d3436" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <ellipse cx="160" cy="425" rx="25" ry="15" fill="#2d3436" />
        <ellipse cx="352" cy="425" rx="25" ry="15" fill="#2d3436" />
        <rect x="186" y="280" width="140" height="120" rx="20" fill="url(#metalBody)" />
        <rect x="216" y="310" width="80" height="60" rx="10" fill="#ffffff" opacity="0.3" />
        <rect x="230" y="330" width="40" height="20" rx="2" stroke="#e17055" strokeWidth="2" fill="none"/>
        <rect x="234" y="334" width="10" height="12" fill="#e17055" />
        <rect x="241" y="260" width="30" height="25" fill="#2d3436" />
        <rect x="176" y="150" width="160" height="110" rx="25" fill="url(#metalBody)" />
        <path d="M256,150 L256,110" stroke="#2d3436" strokeWidth="4" />
        <circle cx="256" cy="110" r="8" fill="#e17055" />
        <g>
          <circle cx="226" cy="200" r="30" fill="#2d3436" />
          <circle cx="226" cy="200" r="24" fill="url(#eyeGlow)" />
          <circle cx="234" cy="192" r="6" fill="#ffffff" opacity="0.8" />
          <circle cx="296" cy="200" r="22" fill="#2d3436" />
          <circle cx="296" cy="200" r="16" fill="url(#eyeGlow)" />
          <circle cx="300" cy="196" r="4" fill="#ffffff" opacity="0.8" />
        </g>
        <circle cx="256" cy="240" r="6" fill="#2d3436" />
        <path d="M186,300 Q140,320 160,360" stroke="#2d3436" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <path d="M326,300 Q372,320 352,360" stroke="#2d3436" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <circle cx="160" cy="360" r="12" fill="#2d3436" />
        <circle cx="352" cy="360" r="12" fill="#2d3436" />
        <g transform="translate(160, 340)">
          <path d="M0,20 L192,20 L192,50 L0,50 Z" fill="#c0392b" />
          <path d="M5,15 L187,15 L187,48 L5,45 Z" fill="#ffffff" />
          <line x1="96" y1="15" x2="96" y2="55" stroke="#dfe6e9" strokeWidth="2" />
        </g>
      </g>
      <path d="M400,80 Q400,200 256,130" stroke="#b2bec3" strokeWidth="1" fill="none" />
      <g transform="translate(256, 130)">
        <line x1="0" y1="0" x2="0" y2="-50" stroke="#b2bec3" strokeWidth="1" />
        <circle cx="0" cy="0" r="6" fill="#2d3436" />
      </g>
    </svg>
);

const BookCard: FC<{ 
    book: BookMetadata; 
    theme: Theme;
    onSelect: (id: string) => void; 
    onDelete: (id: string) => void;
    onGenerateSummary: (id: string) => void;
    onViewSummary: (id: string) => void;
    status?: GenerationStatus;
    viewMode: 'grid' | 'list';
}> = ({ book, theme, onSelect, onDelete, onGenerateSummary, onViewSummary, status, viewMode }) => {
    const isList = viewMode === 'list';
    const progressPercent = Math.round((book.progress || 0) * 100);

    return (
        <Box bg="var(--color-surface)" className="relative group border-4 border-[var(--color-border-color)] shadow-[4px_4px_0_var(--color-border-color)] hover:translate-x-[-1px] transition-all overflow-hidden h-full flex flex-col">
            <Box className={`h-full ${isList ? 'flex flex-row' : 'flex flex-col flex-1'}`}>
                <Box className={`relative cursor-pointer overflow-hidden flex-shrink-0 ${isList ? 'w-28 md:w-36 aspect-[3/4] border-r-4 border-[var(--color-border-color)]' : 'w-full aspect-[3/4] border-b-4 border-[var(--color-border-color)]'}`} onClick={() => onSelect(book.id)}>
                    {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} className="w-full h-full object-cover aspect-[3/4] block" alt={book.title || 'Book Cover'} />
                    ) : (
                        <Box className="w-full h-full aspect-[3/4] bg-slate-100 flex items-center justify-center font-black text-slate-300 text-xs uppercase">
                            {book.isPdf ? 'PDF' : 'EPUB'}
                        </Box>
                    )}
                </Box>
                <Stack p="md" gap="xs" className="flex-1 justify-between min-w-0">
                    <Stack gap={2}>
                        <Group justify="space-between" align="start" wrap="nowrap">
                            <Text className="font-black text-[14px] md:text-[16px] leading-tight truncate text-[var(--color-primary-text)]" title={book.title}>{book.title}</Text>
                            <ActionIcon variant="filled" color="red" size="sm" className="border-2 border-black rounded-none flex-shrink-0" onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}>
                                <IconClose className="w-4 h-4 text-white" />
                            </ActionIcon>
                        </Group>
                        <Text className="text-[10px] font-bold text-[var(--color-secondary-text)] truncate uppercase tracking-widest">{book.author || 'Unknown Author'}</Text>
                    </Stack>
                    <Stack gap={4}>
                        <Group justify="space-between" align="center">
                             <Text className="text-[9px] font-black uppercase text-[var(--color-muted-text)]">Reading Track</Text>
                             <Text className="text-[10px] font-black text-[var(--color-primary-text)]">{progressPercent}%</Text>
                        </Group>
                        <Progress value={progressPercent} size="sm" radius={0} color="var(--color-primary-text)" className="border-2 border-[var(--color-border-color)] h-2 bg-transparent" />
                        <Group gap="xs" mt={4} grow>
                            <Button variant="filled" color="cyan" className="border-2 border-black rounded-none shadow-[2px_2px_0_#000] h-8 p-0 text-[10px] font-black uppercase text-black" onClick={() => onSelect(book.id)}>Open</Button>
                            {book.hasAudio || book.hasSummary ? (
                                <Button variant="filled" color="yellow" className="border-2 border-black rounded-none shadow-[2px_2px_0_#000] h-8 p-0 text-[10px] font-black uppercase text-black" onClick={(e) => { e.stopPropagation(); onViewSummary(book.id); }} leftSection={<IconPlay className="w-3 h-3" />}>Summary</Button>
                            ) : (
                                <Button variant="outline" color="dark" className="border-2 border-[var(--color-border-color)] rounded-none h-8 p-0 text-[10px] font-black uppercase text-[var(--color-primary-text)]" onClick={(e) => { e.stopPropagation(); onGenerateSummary(book.id); }} loading={!!status}>{status ? status.stage : 'Analyze'}</Button>
                            )}
                        </Group>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
};

const LibraryView: FC<LibraryProps> = ({ books, theme, onBookSelect, isLoading, onDelete, onGenerateSummary, generationStatuses, onViewSummary, viewMode, isCloudSynced }) => {
  return (
    <Box className="py-4 md:py-8 animate-fade-in pb-32">
        <header className="mb-10 border-b-4 border-[var(--color-border-color)] pb-6 flex justify-between items-end">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--color-primary-text)] uppercase">{books.length} Books</h2>
            {!isCloudSynced && (
                <Box className="hidden sm:block px-3 py-1 bg-yellow-400 border-2 border-black shadow-[2px_2px_0_black] mb-1">
                    <Text className="text-[9px] font-black uppercase text-black">Local Storage Device Only</Text>
                </Box>
            )}
        </header>
        {isLoading && (
            <Box className="bg-[var(--color-surface)] border-4 border-[var(--color-border-color)] p-20 flex flex-col items-center justify-center text-center shadow-[4px_4px_0_var(--color-border-color)] animate-pulse">
                <IconSpinner className="w-12 h-12 text-[var(--color-primary)] mb-6" />
                <Text className="text-[13px] font-black uppercase text-[var(--color-primary-text)]">Adding Book...</Text>
            </Box>
        )}
        {!isLoading && books.length === 0 && (
            <Box className="py-12 flex flex-col items-center justify-center text-center">
                <EmptyLibraryGraphic /><h2 className="text-2xl font-black mt-4 text-[var(--color-primary-text)]">Empty Library</h2><p className="text-[12px] font-bold opacity-60 mt-2 uppercase text-[var(--color-secondary-text)]">Upload a book to start.</p>
            </Box>
        )}
        <SimpleGrid cols={viewMode === 'list' ? { base: 1, md: 2 } : { base: 2, sm: 2, md: 3, lg: 4, xl: 4 }} spacing="xl">
            {books.map(book => <BookCard key={book.id} book={book} theme={theme} onSelect={onBookSelect} onDelete={onDelete} onGenerateSummary={onGenerateSummary} onViewSummary={onViewSummary} status={generationStatuses[book.id]} viewMode={viewMode} />)}
        </SimpleGrid>
    </Box>
  );
};

export default LibraryView;
