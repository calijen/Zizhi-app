
import { FC, useState, useMemo } from 'react';
import { Text, Group, ActionIcon, Box, Stack } from '@mantine/core';
import type { Note, Theme, BookMetadata } from '../types';
import { IconTrash, IconSearch, IconNote } from './icons';

interface NotesViewProps {
  notes: Note[];
  library?: BookMetadata[];
  theme: Theme;
  onDelete: (id: string) => void;
  onGoToNote: (note: Note) => void;
}

const EmptyNotesGraphic = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="300" height="300" className="mx-auto mb-4">
      <defs>
        <linearGradient id="noteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD54F" stopOpacity={1} />
          <stop offset="100%" stopColor="#FFB300" stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d="M420.5,310.5Q411,371,360.5,405Q310,439,250.5,425.5Q191,412,143,373.5Q95,335,106.5,272.5Q118,210,165.5,170Q213,130,274.5,138.5Q336,147,393,198.5Q450,250,420.5,310.5Z" fill="#FFF8E1" />
      <rect x="156" y="100" width="200" height="250" rx="10" ry="10" fill="url(#noteGrad)" stroke="#000" strokeWidth="4" />
      <path d="M186 150 H326 M186 180 H326 M186 210 H280" stroke="#000" strokeWidth="4" strokeLinecap="round" opacity="0.2" />
      <path d="M300 300 L380 220 L400 240 L320 320 Z" fill="#4FC3F7" stroke="#000" strokeWidth="2" />
      <path d="M380 220 L400 240 L410 230 L390 210 Z" fill="#0288D1" stroke="#000" strokeWidth="2" />
    </svg>
);

const NoteCard: FC<{ note: Note; onDelete: (id: string) => void; onGoToNote: (n: Note) => void; }> = ({ note, onDelete, onGoToNote }) => {
    return (
        <div className="p-5 bg-[var(--color-surface)] border-4 border-black group relative shadow-[4px_4px_0_black] hover:translate-x-[-1px] transition-all flex flex-col h-auto">
            <div className="flex justify-between items-start mb-3">
                <Text className="text-[9px] font-black uppercase text-pink-500 truncate max-w-[140px]">{note.author}</Text>
                <ActionIcon variant="filled" color="red" size="xs" className="border-2 border-black rounded-none shadow-[1px_1px_0_black]" onClick={() => onDelete(note.id)}><IconTrash className="w-3 h-3 text-black" /></ActionIcon>
            </div>
            
            <Box className="mb-4 p-3 bg-black/5 border-l-4 border-cyan-400 italic text-xs text-[var(--color-muted-text)] line-clamp-3">
                "{note.text}"
            </Box>

            <p className="text-sm font-bold leading-tight text-[var(--color-primary-text)] cursor-pointer hover:opacity-80 transition-opacity mb-4" onClick={() => onGoToNote(note)}>
                {note.note}
            </p>

            <div className="mt-auto pt-2 border-t border-black/10">
                <Text className="text-[8px] font-black text-[var(--color-muted-text)] uppercase truncate">{note.bookTitle}</Text>
            </div>
        </div>
    );
};

const NotesView: FC<NotesViewProps> = ({ notes, library = [], theme, onDelete, onGoToNote }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredNotes = useMemo(() => notes.filter(n => 
    n.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.note.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
  ), [notes, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-10 pb-40 animate-fade-in">
      <header className="border-b-4 border-black pb-6">
        <h2 className="text-3xl font-black text-[var(--color-primary-text)] uppercase">Notes</h2>
      </header>
      
      <div className="relative">
        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted-text)]" />
        <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-[var(--color-surface)] border-4 border-black p-4 pl-12 text-[14px] font-black text-[var(--color-primary-text)] outline-none shadow-[4px_4px_0_black] focus:translate-x-[-1px] transition-all" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
        {filteredNotes.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <EmptyNotesGraphic />
                <h2 className="text-2xl font-black mt-4 text-[var(--color-primary-text)] uppercase">No Notes</h2>
                <p className="text-[12px] font-black text-[var(--color-muted-text)] uppercase">Add notes to text in a book to see them here.</p>
            </div>
        ) : (
            filteredNotes.map((note, idx) => (
                <NoteCard key={`note-${note.id || idx}-${idx}`} note={note} onDelete={onDelete} onGoToNote={onGoToNote} />
            ))
        )}
      </div>
    </div>
  );
};

export default NotesView;
