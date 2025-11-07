import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Book } from '../types';
import { IconPlay, IconPause, IconClose, IconRewind, IconForward } from './icons';

interface TrailerViewProps {
  book: Book;
  onClose: () => void;
}

interface TimedWord {
  word: string;
  start: number;
  end: number;
}

interface TimedSentence {
  words: TimedWord[];
  start: number;
  end: number;
}


const TrailerView: React.FC<TrailerViewProps> = ({ book, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [timedScript, setTimedScript] = useState<TimedSentence[] | null>(null);

  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLHeadingElement>(null);
  const [titleMarquee, setTitleMarquee] = useState({ enabled: false, duration: '10s' });


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

    // A short delay allows the browser to render and calculate widths correctly
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

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    const handleLoadedMetadata = () => {
      const audioDuration = audio.duration;
      if (!isFinite(audioDuration) || audioDuration <= 0) return;

      setDuration(audioDuration);

      if (book.trailerScript) {
        const script = book.trailerScript;
        const sentences = script.match(/[^.!?]+[.!?\n]+/g) || [script];
        const allWords = sentences.flatMap(s => s.trim().split(/\s+/)).filter(Boolean);
        const totalWords = allWords.length;

        if (totalWords === 0) {
            setTimedScript([]);
            return;
        }

        const avgWordDuration = audioDuration / totalWords;
        let wordCounter = 0;

        const newTimedScript = sentences.map(sentenceStr => {
          const words = sentenceStr.trim().split(/\s+/).filter(Boolean);
          const sentenceStart = wordCounter * avgWordDuration;

          const timedWords = words.map((word) => {
            const start = wordCounter * avgWordDuration;
            wordCounter++;
            const end = wordCounter * avgWordDuration;
            return { word, start, end };
          });

          const sentenceEnd = (wordCounter * avgWordDuration);

          return {
            words: timedWords,
            start: sentenceStart,
            end: sentenceEnd,
          };
        });

        setTimedScript(newTimedScript);
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    audio.play().catch(e => console.error("Audio autoplay failed:", e));

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [book.trailerScript]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(event.target.value);
    if (!isPlaying) {
      // If paused, we need to manually trigger a time update to refresh UI
       setCurrentTime(Number(event.target.value));
    }
  };
  
  const handleRewind = () => {
      if (!audioRef.current) return;
      const newTime = Math.max(0, audioRef.current.currentTime - 15);
      audioRef.current.currentTime = newTime;
      if (!isPlaying) setCurrentTime(newTime);
  };
  
  const handleForward = () => {
      if (!audioRef.current) return;
      const newTime = Math.min(duration, audioRef.current.currentTime + 15);
      audioRef.current.currentTime = newTime;
      if (!isPlaying) setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentSentence = useMemo(() => {
    if (!timedScript) return null;
    // Add a small buffer to the end time to make sure the last word stays highlighted
    return timedScript.find(s => currentTime >= s.start && currentTime < s.end + 0.1);
  }, [timedScript, currentTime]);
  
  const CaptionDisplay = () => (
    <div className="flex items-center justify-center text-center h-full w-full p-4">
        {currentSentence ? (
            <p className="text-primary-text font-serif text-2xl lg:text-4xl leading-relaxed transition-opacity duration-300">
                {currentSentence.words.map((word, index) => {
                    // Add a small buffer to the end time to keep the word highlighted a bit longer
                    const isCurrent = currentTime >= word.start && currentTime < word.end + 0.1;
                    return (
                        <span key={index} className={`transition-opacity duration-200 ${isCurrent ? 'opacity-100 font-semibold' : 'opacity-60'}`}>
                            {word.word}{' '}
                        </span>
                    );
                })}
            </p>
        ) : (
            <div className="h-32 lg:h-48">&nbsp;</div> // Placeholder to prevent layout shift
        )}
    </div>
  );

  if (!book.audioTrailerUrl) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-search-panel-in" role="dialog" aria-modal="true">
        <audio ref={audioRef} src={book.audioTrailerUrl} />
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-border-color/20 transition-colors" aria-label="Close trailer">
            <IconClose className="w-6 h-6 text-primary-text" />
        </button>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-row h-full w-full">
            <div className="w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-md aspect-[4/3] shadow-2xl rounded-lg overflow-hidden">
                    {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-border-color/10 text-center text-secondary-text/50 p-4">
                            <span className="font-serif text-2xl">{book.title}</span>
                        </div>
                    )}
                </div>
                <div className="w-full max-w-md mt-8">
                    <input
                        type="range"
                        min="0"
                        max={duration || 1}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-border-color/30 rounded-lg appearance-none cursor-pointer range-sm accent-primary"
                    />
                     <div className="flex items-center justify-between text-xs text-secondary-text mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-8 mt-4">
                        <button onClick={handleRewind} className="text-primary-text/70 hover:text-primary-text"><IconRewind className="w-8 h-8" /></button>
                        <button onClick={handlePlayPause} className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                            {isPlaying ? <IconPause className="w-8 h-8" /> : <IconPlay className="w-8 h-8" />}
                        </button>
                        <button onClick={handleForward} className="text-primary-text/70 hover:text-primary-text"><IconForward className="w-8 h-8" /></button>
                    </div>
                </div>
            </div>
            <div className="w-1/2 flex items-center justify-center p-8 lg:p-16">
                 <CaptionDisplay />
            </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col h-full w-full p-4 pt-16">
            <div className="flex items-center gap-4 p-2 mb-6 flex-shrink-0">
                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-border-color/10"></div>
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
                    <p className="text-sm text-secondary-text truncate">{book.author}</p>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto mb-4">
                <CaptionDisplay />
            </div>

            <div className="flex-shrink-0 mt-auto">
                <input
                    type="range"
                    min="0"
                    max={duration || 1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-border-color/30 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center justify-between text-xs text-secondary-text mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
                <div className="flex items-center justify-center gap-8 mt-4">
                    <button onClick={handleRewind} className="text-primary-text/70 hover:text-primary-text"><IconRewind className="w-7 h-7" /></button>
                    <button onClick={handlePlayPause} className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
                        {isPlaying ? <IconPause className="w-7 h-7" /> : <IconPlay className="w-7 h-7" />}
                    </button>
                    <button onClick={handleForward} className="text-primary-text/70 hover:text-primary-text"><IconForward className="w-7 h-7" /></button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TrailerView;