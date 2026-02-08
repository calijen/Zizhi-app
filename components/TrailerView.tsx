
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Book, GenerationStatus } from '../types';
import { IconPlay, IconPause, IconClose, IconRewind, IconForward, IconSpinner } from './icons';

interface SummaryViewProps {
  book: Book;
  onClose: () => void;
  generationStatus?: GenerationStatus;
}

const SummaryView: React.FC<SummaryViewProps> = ({ book, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0); 
  const [activePhraseIndex, setActivePhraseIndex] = useState<number>(-1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const activePhraseRef = useRef<HTMLParagraphElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateProgress = () => {
        setCurrentTime(audio.currentTime);
        rafRef.current = requestAnimationFrame(updateProgress);
    };

    const handleLoadedMetadata = () => {
        if (isFinite(audio.duration)) setDuration(audio.duration);
    };

    const handlePlay = () => { setIsPlaying(true); rafRef.current = requestAnimationFrame(updateProgress); };
    const handlePause = () => { setIsPlaying(false); cancelAnimationFrame(rafRef.current); };
    const handleEnded = () => { setIsPlaying(false); cancelAnimationFrame(rafRef.current); setCurrentTime(0); };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    if (audio.readyState >= 1) handleLoadedMetadata();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current || !book.audioSummaryUrl) return;
    if (audioRef.current.paused) audioRef.current.play();
    else audioRef.current.pause();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (audioRef.current) {
          audioRef.current.currentTime = val;
          setCurrentTime(val);
      }
  };

  const cycleSpeed = () => {
      const speeds = [0.75, 1, 1.25, 1.5, 2];
      const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
      setPlaybackRate(next);
      if (audioRef.current) audioRef.current.playbackRate = next;
  };

  // Sync Engine: Split script into meaningful Line blocks
  const timedLines = useMemo(() => {
    if (!book.summaryScript || !duration) return [];
    
    // Split on punctuation (. ! ?)
    const rawLines = book.summaryScript.match(/[^.!?]+[.!?]+/g) || [book.summaryScript];
    const processedLines = rawLines.map(line => line.trim()).filter(l => l.length > 0);
    
    const totalChars = processedLines.reduce((acc, l) => acc + l.length, 0);
    let accumulatedTime = 0;
    
    return processedLines.map((text) => {
        const lineDuration = (text.length / totalChars) * duration;
        const start = accumulatedTime;
        const end = start + lineDuration;
        accumulatedTime = end;
        return { text, start, end };
    });
  }, [book.summaryScript, duration]);

  useEffect(() => {
    const index = timedLines.findIndex(p => currentTime >= p.start && currentTime < p.end);
    if (index !== -1 && index !== activePhraseIndex) setActivePhraseIndex(index);
  }, [currentTime, timedLines, activePhraseIndex]);

  useEffect(() => {
    if (activePhraseRef.current) {
        activePhraseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activePhraseIndex]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] text-white flex flex-col animate-search-panel-in select-none">
        {book.audioSummaryUrl && <audio ref={audioRef} src={book.audioSummaryUrl} preload="auto" />}
        <header className="p-6 flex items-center justify-between z-20">
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors"><IconClose className="w-6 h-6" /></button>
            <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Master Editorial</p>
                <p className="text-xs font-bold truncate max-w-[200px] opacity-30 mt-1">{book.title}</p>
            </div>
            <button onClick={cycleSpeed} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[11px] font-black hover:bg-white/10 transition-colors border border-white/5">
                {playbackRate}x
            </button>
        </header>
        <main className="flex-1 flex flex-col md:flex-row p-6 md:p-16 gap-8 md:gap-24 items-center overflow-hidden">
            <div className="w-48 md:w-full md:max-w-[450px] aspect-square shadow-[0_50px_150px_rgba(0,0,0,1)] rounded-[3rem] overflow-hidden bg-[#1a1a1a] flex-none border border-white/10 relative">
                {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-8 opacity-20 italic text-center text-lg md:text-2xl font-serif">{book.title}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="flex-1 flex flex-col justify-center w-full max-w-5xl h-full overflow-hidden">
                <div ref={scrollContainerRef} className="h-full overflow-y-auto no-scrollbar py-60 md:py-80" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)' }}>
                    <div className="font-serif text-3xl md:text-6xl leading-[1.6] text-left px-4 space-y-16">
                        {timedLines.map((item, index) => (
                            <p 
                                key={index} 
                                ref={index === activePhraseIndex ? activePhraseRef : null} 
                                className={`transition-all duration-1000 ease-out py-2 ${index === activePhraseIndex ? 'text-white opacity-100 translate-x-4 blur-0 scale-105' : 'text-white/10 blur-[2px] scale-95 origin-left'}`}
                            >
                                {item.text}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </main>
        <footer className="p-8 md:p-12 pb-16 bg-gradient-to-t from-black via-black to-transparent flex flex-col gap-8 flex-none border-t border-white/5">
            <div className="max-w-4xl mx-auto w-full space-y-4">
                <input type="range" min="0" max={duration || 100} step="0.1" value={currentTime} onChange={handleSeek}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" />
                <div className="flex justify-between text-[11px] font-black opacity-30 tabular-nums tracking-[0.2em] uppercase">
                    <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                    <span>{duration > 0 ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}</span>
                </div>
            </div>
            <div className="flex items-center justify-center gap-10 md:gap-14">
                <button onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 15; }} className="opacity-40 hover:opacity-100 transition-all active:scale-90"><IconRewind className="w-8 h-8 md:w-10 md:h-10" /></button>
                <button onClick={handlePlayPause} className="w-20 h-20 md:w-24 md:h-24 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-2xl">
                    {isPlaying ? <IconPause className="w-10 h-10 md:w-12 md:h-12" /> : <IconPlay className="w-10 h-10 md:w-12 md:h-12 pl-2" />}
                </button>
                <button onClick={() => { if(audioRef.current) audioRef.current.currentTime += 15; }} className="opacity-40 hover:opacity-100 transition-all active:scale-90"><IconForward className="w-8 h-8 md:w-10 md:h-10" /></button>
            </div>
        </footer>
    </div>
  );
};

export default SummaryView;
