
import React, { useState, useRef, useEffect, useMemo } from 'react';
// Fixed: Combined and updated imports to use types.ts for all shared interfaces
import type { Book, GenerationStatus } from '../types';
import { IconPlay, IconPause, IconClose, IconRewind, IconForward, IconSpinner } from './icons';

interface SummaryViewProps {
  book: Book;
  onClose: () => void;
  generationStatus?: GenerationStatus;
}

interface TimedWord {
  word: string;
  start: number;
  end: number;
}


const SummaryView: React.FC<SummaryViewProps> = ({ book, onClose, generationStatus }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);

  const audioRef = useRef<HTMLAudioElement>(null);

  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLHeadingElement>(null);
  const [titleMarquee, setTitleMarquee] = useState({ enabled: false, duration: '10s' });
  
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use the explicit audioDuration from book if available, otherwise 0 until loaded
  const knownDuration = book.audioDuration || 0;

  useEffect(() => {
    const checkOverflow = () => {
        if (titleContainerRef.current && titleTextRef.current) {
            const container = titleContainerRef.current;
            const text = titleTextRef.current;
            const isOverflow = text.scrollWidth > container.clientWidth;

            if (isOverflow) {
                const duration = text.scrollWidth / 40; // Speed: 40px/sec
                setTitleMarquee({ enabled: true, duration: `${duration}s` });
            } else {
                setTitleMarquee({ enabled: false, duration: '10s' });
            }
        }
    };

    const timer = setTimeout(checkOverflow, 100); 
    window.addEventListener('resize', checkOverflow);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkOverflow);
    };
  }, [book.title]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state on new book/url
    setCurrentTime(0);
    setActiveWordIndex(-1);
    // Use valid duration from book calculation if available
    setDuration(knownDuration); 
    setIsPlaying(false);

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    
    // Sync React state with actual Audio element state
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: any) => {
        console.error("Audio Playback Error", e);
        setIsPlaying(false);
    }

    const handleLoadedMetadata = () => {
      // If we didn't get a calculated duration (legacy book), try browser metadata
      if (!knownDuration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [book.audioSummaryUrl, book.summaryScript, knownDuration]);

  // Handle Autoplay reliably when generation finishes
  useEffect(() => {
    if (!generationStatus && book.audioSummaryUrl && audioRef.current) {
        // Wait a tick to ensure DOM is ready
        setTimeout(() => {
             const playPromise = audioRef.current?.play();
             if (playPromise !== undefined) {
                 playPromise.catch(error => {
                     // Auto-play was prevented. This is expected in many browsers.
                     // We just ensure the UI state reflects "Paused" so the user can click Play.
                     console.log("Autoplay prevented:", error);
                     setIsPlaying(false);
                 });
             }
        }, 100);
    }
  }, [generationStatus, book.audioSummaryUrl]);

  const handlePlayPause = () => {
    if (!audioRef.current || !book.audioSummaryUrl) return;
    if (audioRef.current.paused) {
      const playPromise = audioRef.current.play();
      if(playPromise !== undefined) {
          playPromise.catch(e => console.error("Play failed", e));
      }
    } else {
      audioRef.current.pause();
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(event.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  const handleRewind = () => {
      if (!audioRef.current) return;
      const newTime = Math.max(0, audioRef.current.currentTime - 15);
      audioRef.current.currentTime = newTime;
  };
  
  const handleForward = () => {
      if (!audioRef.current) return;
      const newTime = Math.min(duration, audioRef.current.currentTime + 15);
      audioRef.current.currentTime = newTime;
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Character-based timing calculation
  const timedScript = useMemo(() => {
    if (!book.summaryScript) return [];
    
    // We use the calculated duration if available, else fallback to 0 until metadata loads
    const totalDuration = knownDuration || duration; 
    
    if (!totalDuration) return [];

    const text = book.summaryScript;
    const words = text.trim().split(/\s+/);
    
    const totalChars = words.reduce((acc, word) => acc + word.length, 0);
    
    if (totalChars === 0) return [];

    const durationPerChar = totalDuration / totalChars;
    let currentWordStart = 0;
    
    return words.map(word => {
        // Duration of this word is proportional to its character length
        const wordDuration = word.length * durationPerChar;
        const start = currentWordStart;
        const end = currentWordStart + wordDuration;
        currentWordStart = end;
        
        return {
            word,
            start,
            end
        };
    });

  }, [book.summaryScript, knownDuration, duration]);

  // Decoupled Active Word Logic
  // Only update active word index when it actually changes to prevent layout thrashing
  useEffect(() => {
      if (timedScript.length === 0) return;
      
      const index = timedScript.findIndex(word => currentTime >= word.start && currentTime < word.end);
      
      // Only update state if index actually changed to avoid re-renders
      if (index !== -1 && index !== activeWordIndex) {
          setActiveWordIndex(index);
      }
  }, [currentTime, timedScript, activeWordIndex]);

  // Scroll logic triggered ONLY when active word changes
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [activeWordIndex]);

  
  const CaptionDisplay = () => (
    <div className="flex flex-col items-center justify-center text-center h-full w-full p-4 relative" aria-live="polite">
        
        {/* Loading Overlay */}
        {generationStatus && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(var(--color-background-rgb),0.85)] z-20 space-y-4 backdrop-blur-sm transition-opacity">
                  <div className="w-12 h-12 text-[var(--color-primary)] animate-spin">
                       <IconSpinner className="w-full h-full" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-[var(--color-primary-text)] animate-pulse">
                        {generationStatus.currentAction}
                    </h3>
                    {generationStatus.stage !== 'audio' && (
                        <p className="text-sm text-[var(--color-secondary-text)] mt-1">
                            This usually takes about 20-30 seconds.
                        </p>
                    )}
                  </div>
                  <div className="w-64 h-1.5 bg-[rgba(var(--color-border-color-rgb),0.5)] rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
                        style={{ width: `${generationStatus.progress}%` }}
                      />
                  </div>
             </div>
        )}

        {/* Text Display - Teleprompter Style */}
        {(timedScript.length > 0 || (book.summaryScript && !generationStatus)) || (generationStatus && book.summaryScript) ? (
            <div className="transition-opacity duration-300 w-full relative h-full flex flex-col justify-center">
                
                {/* 
                    Container for the scrolling text.
                */}
                <div 
                  ref={scrollContainerRef}
                  className="h-48 sm:h-60 w-full overflow-y-auto no-scrollbar relative text-center"
                  style={{
                    maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
                  }}
                >
                    <div className={`${timedScript.length > 0 ? 'py-20 sm:py-24' : 'py-4'} px-4 transition-all duration-500`}>
                        <p className="text-[var(--color-primary-text)] font-serif text-xl sm:text-2xl leading-relaxed">
                            {timedScript.length > 0 ? (
                                timedScript.map((item, index) => {
                                    const isActive = index === activeWordIndex;
                                    
                                    return (
                                        <span
                                            key={index}
                                            ref={isActive ? activeWordRef : null}
                                            className={`transition-all duration-200 inline-block mx-0.5 rounded px-0.5 ${
                                                isActive 
                                                    ? 'text-[var(--color-primary-text)] scale-105 opacity-100 transform origin-center font-medium' 
                                                    : 'text-[var(--color-secondary-text)] opacity-80'
                                            }`}
                                        >
                                            {item.word}
                                        </span>
                                    );
                                })
                            ) : (
                               // Fallback
                               book.summaryScript
                            )}
                        </p>
                    </div>
                </div>

                {generationStatus?.stage === 'audio' && (
                    <div className="absolute top-full left-0 right-0 mt-4 text-center pointer-events-none">
                        <p className="text-sm font-bold text-[var(--color-primary)] animate-pulse uppercase tracking-wider bg-[var(--color-background)] inline-block px-4 py-2 rounded-full shadow-md border border-[var(--color-border-color)]">
                            Generating Audio...
                        </p>
                    </div>
                )}
            </div>
        ) : (
             !generationStatus && (
                <div className="h-32 lg:h-48 flex items-center justify-center text-[var(--color-secondary-text)]">
                    <span className="italic flex items-center gap-2">
                        Ready to play
                    </span>
                </div>
            )
        )}
    </div>
  );

  const isControlsDisabled = !!generationStatus || !book.audioSummaryUrl;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-background)] flex flex-col animate-search-panel-in" role="dialog" aria-modal="true" aria-label="Book Summary">
        {book.audioSummaryUrl && (
             <audio 
                ref={audioRef} 
                src={book.audioSummaryUrl} 
                preload="auto" 
                playsInline
            />
        )}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-[rgba(var(--color-border-color-rgb),0.2)] transition-colors" aria-label="Close summary">
            <IconClose className="w-6 h-6 text-[var(--color-primary-text)]" />
        </button>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-row h-full w-full">
            <div className="w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-md aspect-[4/3] shadow-2xl rounded-lg overflow-hidden bg-[var(--color-background)] relative">
                    {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[rgba(var(--color-border-color-rgb),0.1)] text-center text-[rgba(var(--color-secondary-text-rgb),0.5)] p-4">
                            <span className="font-serif text-2xl">{book.title}</span>
                        </div>
                    )}
                </div>
                <div className="w-full max-w-md mt-8">
                     <h2 className="text-xl font-bold mb-1 text-center truncate">{book.title}</h2>
                     <p className="text-sm text-[var(--color-secondary-text)] text-center mb-6">{book.author}</p>

                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={isControlsDisabled}
                        className={`w-full h-1.5 bg-[rgba(var(--color-border-color-rgb),0.3)] rounded-lg appearance-none cursor-pointer range-sm accent-[var(--color-primary)] ${isControlsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Seek summary position"
                    />
                     <div className="flex items-center justify-between text-xs text-[var(--color-secondary-text)] mt-1" aria-hidden="true">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-8 mt-4">
                        <button onClick={handleRewind} disabled={isControlsDisabled} className="text-[rgba(var(--color-primary-text-rgb),0.7)] hover:text-[var(--color-primary-text)] disabled:opacity-30" aria-label="Rewind 15 seconds"><IconRewind className="w-8 h-8" /></button>
                        <button onClick={handlePlayPause} disabled={isControlsDisabled} className="bg-[var(--color-primary)] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100" aria-label={isPlaying ? "Pause" : "Play"}>
                            {isPlaying ? <IconPause className="w-8 h-8" /> : <IconPlay className="w-8 h-8 pl-1" />}
                        </button>
                        <button onClick={handleForward} disabled={isControlsDisabled} className="text-[rgba(var(--color-primary-text-rgb),0.7)] hover:text-[var(--color-primary-text)] disabled:opacity-30" aria-label="Forward 15 seconds"><IconForward className="w-8 h-8" /></button>
                    </div>
                </div>
            </div>
            <div className="w-1/2 flex items-center justify-center p-8 lg:p-16 border-l border-[var(--color-border-color)] h-full overflow-hidden">
                 <CaptionDisplay />
            </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col h-full w-full p-4 pt-16">
            <div className="flex items-center gap-4 p-2 mb-6 flex-shrink-0">
                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 shadow-md">
                    {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[rgba(var(--color-border-color-rgb),0.1)]"></div>
                    )}
                </div>
                <div ref={titleContainerRef} className="min-w-0 flex-1">
                    <div className="relative h-6 flex items-center">
                        <h2 ref={titleTextRef} className="font-bold text-lg whitespace-nowrap absolute opacity-0 -z-10" aria-hidden="true">
                            {book.title}
                        </h2>
                        {titleMarquee.enabled ? (
                            <div className="marquee-parent w-full h-full">
                                <div className="marquee-child items-center" style={{ animationDuration: titleMarquee.duration }}>
                                    <span className="font-bold text-lg pr-8">{book.title}</span>
                                    <span className="font-bold text-lg pr-8" aria-hidden="true">{book.title}</span>
                                </div>
                            </div>
                        ) : (
                            <h2 className="font-bold text-lg truncate">
                                {book.title}
                            </h2>
                        )}
                    </div>
                    <p className="text-sm text-[var(--color-secondary-text)] truncate">{book.author}</p>
                </div>
            </div>

            <div className="flex-grow overflow-hidden mb-4 relative flex items-center">
                <CaptionDisplay />
            </div>

            <div className="flex-shrink-0 mt-auto pb-8">
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    disabled={isControlsDisabled}
                    className={`w-full h-1.5 bg-[rgba(var(--color-border-color-rgb),0.3)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] ${isControlsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Seek summary position"
                />
                <div className="flex items-center justify-between text-xs text-[var(--color-secondary-text)] mt-1" aria-hidden="true">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
                <div className="flex items-center justify-center gap-8 mt-4">
                    <button onClick={handleRewind} disabled={isControlsDisabled} className="text-[rgba(var(--color-primary-text-rgb),0.7)] hover:text-[var(--color-primary-text)] disabled:opacity-30" aria-label="Rewind 15 seconds"><IconRewind className="w-7 h-7" /></button>
                    <button onClick={handlePlayPause} disabled={isControlsDisabled} className="bg-[var(--color-primary)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50" aria-label={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? <IconPause className="w-7 h-7" /> : <IconPlay className="w-7 h-7 pl-1" />}
                    </button>
                    <button onClick={handleForward} disabled={isControlsDisabled} className="text-[rgba(var(--color-primary-text-rgb),0.7)] hover:text-[var(--color-primary-text)] disabled:opacity-30" aria-label="Forward 15 seconds"><IconForward className="w-7 h-7" /></button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SummaryView;