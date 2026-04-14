
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// Import Box from @mantine/core to fix missing component error
import { Box } from '@mantine/core';
import type { Book, GenerationStatus } from '../types';
import { IconPlay, IconPause, IconClose, IconRewind, IconForward } from './icons';

interface SummaryViewProps {
  book: Book;
  onClose: () => void;
  generationStatus?: GenerationStatus;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64.split(',')[1] || base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const SummaryView: React.FC<SummaryViewProps> = ({ book, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0); 
  const [activePhraseIndex, setActivePhraseIndex] = useState<number>(-1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const activePhraseRef = useRef<HTMLParagraphElement>(null);

  const timedLines = useMemo(() => {
    if (!book.summaryScript || !duration) return [];
    const processedLines = book.summaryScript.split(/\n\n+/).flatMap(p => p.match(/[^.!?]+[.!?]+/g) || [p]).map(line => line.trim()).filter(l => l.length > 5);
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

  const playAt = useCallback(async (time: number) => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    
    // Resume context if it was suspended (autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    sourceNodeRef.current?.stop();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(audioContextRef.current.destination);
    
    const offset = Math.max(0, Math.min(time, duration - 0.01));
    source.start(0, offset);
    
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    sourceNodeRef.current = source;
    setIsPlaying(true);
    setCurrentTime(offset);
  }, [duration, playbackRate]);

  useEffect(() => {
    const initAudio = async () => {
      if (!book.audioSummaryUrl) return;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      try {
        const rawBytes = decodeBase64(book.audioSummaryUrl);
        const buffer = await decodeAudioData(rawBytes, audioContext, 24000, 1);
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        setIsReady(true);
      } catch (err) {
        console.error("Audio error:", err);
      }
    };
    initAudio();
    return () => {
      sourceNodeRef.current?.stop();
      audioContextRef.current?.close();
      cancelAnimationFrame(rafRef.current);
    };
  }, [book.audioSummaryUrl]);

  const updateProgress = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return;
    const now = audioContextRef.current.currentTime;
    const elapsed = now - startTimeRef.current;
    setCurrentTime(elapsed);
    
    if (elapsed >= duration) {
        setIsPlaying(false);
        setCurrentTime(0);
        pauseTimeRef.current = 0;
        cancelAnimationFrame(rafRef.current);
    } else {
        rafRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying, duration]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else {
        cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, updateProgress]);

  const handlePlayPause = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    if (isPlaying) {
      pauseTimeRef.current = currentTime;
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
    } else {
      playAt(pauseTimeRef.current);
    }
    setUserInteracted(true);
  };

  useEffect(() => {
    const index = timedLines.findIndex(p => currentTime >= p.start && currentTime < p.end);
    if (index !== -1 && index !== activePhraseIndex) setActivePhraseIndex(index);
  }, [currentTime, timedLines, activePhraseIndex]);

  useEffect(() => {
    if (activePhraseRef.current) {
        activePhraseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activePhraseIndex]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    pauseTimeRef.current = time;
    if (isPlaying) {
        playAt(time);
    } else {
        setCurrentTime(time);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[var(--color-background)] text-[var(--color-primary-text)] flex flex-col animate-fade-in select-none overflow-hidden">
        <header className="p-4 md:p-8 flex items-center justify-between z-20 relative bg-[var(--color-surface)] border-b-4 border-black shadow-[0_4px_0_#000] rounded-none">
            <button onClick={onClose} className="p-2 md:p-3 bg-cyan-400 border-2 border-black shadow-[2px_2px_0_#000] transition-all rounded-none"><IconClose className="w-5 h-5 md:w-6 md:h-6 text-black" /></button>
            <div className="text-center">
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-pink-500">Insights</p>
                <p className="text-[10px] md:text-xs font-black truncate max-w-[150px] md:max-w-[200px] uppercase mt-1 text-[var(--color-primary-text)]">{book.title}</p>
            </div>
            <button onClick={() => {
                const speeds = [1, 1.25, 1.5, 2];
                const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
                setPlaybackRate(next);
                if (sourceNodeRef.current) sourceNodeRef.current.playbackRate.value = next;
            }} className="w-10 h-10 md:w-12 md:h-12 bg-yellow-300 border-2 border-black flex items-center justify-center text-[10px] md:text-[12px] font-black shadow-[2px_2px_0_#000] text-black rounded-none">
                {playbackRate}X
            </button>
        </header>

        <main className="flex-1 flex flex-col md:flex-row p-6 md:p-20 gap-8 md:gap-16 items-center overflow-hidden relative">
            {!isReady ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 border-4 border-black border-t-cyan-400 animate-spin mb-6"></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary-text)]">Loading session...</p>
                </div>
            ) : !userInteracted ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                     <Box className="w-48 md:w-64 aspect-square border-4 border-black shadow-[10px_10px_0_#000] overflow-hidden rounded-none">
                        <img src={book.coverImageUrl || ''} className="w-full h-full object-cover" />
                     </Box>
                     <button 
                        onClick={() => { setUserInteracted(true); playAt(0); }}
                        className="px-12 py-6 bg-pink-500 text-white font-black border-4 border-black shadow-[8px_8px_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest text-xl rounded-none"
                     >
                         Start Insight
                     </button>
                 </div>
            ) : (
                <div className="flex-1 flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start overflow-hidden w-full h-full">
                    {/* Left Column: Cover, Progress, and Controls (Desktop) */}
                    <div className={`flex-col items-center gap-8 md:w-1/3 lg:w-1/4 ${isPlaying ? 'hidden md:flex' : 'flex'} transition-all duration-300`}>
                        <div className="w-48 md:w-full aspect-square shadow-[10px_10px_0_#000] border-4 border-black overflow-hidden bg-[var(--color-surface)] rounded-none">
                            {book.coverImageUrl && <img src={book.coverImageUrl} className="w-full h-full object-cover" />}
                        </div>
                        
                        {/* Desktop-only playback controls and progress */}
                        <div className="hidden md:flex flex-col items-center gap-10 w-full">
                            {/* Progress Bar */}
                            <div className="w-full space-y-3">
                                <div className="h-4 bg-black/10 border-2 border-black relative overflow-hidden rounded-none">
                                   <div className="absolute inset-y-0 left-0 bg-cyan-400" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                                   <input type="range" min="0" max={duration || 100} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                </div>
                                <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-[var(--color-primary-text)]">
                                    <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                                    <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-6">
                                <button onClick={() => playAt(Math.max(0, currentTime - 10))} className="bg-[var(--color-background)] border-2 border-black p-2 shadow-[2px_2px_0_#000] text-[var(--color-primary-text)] rounded-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                                    <IconRewind className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={handlePlayPause} 
                                    className="w-16 h-16 bg-pink-500 border-4 border-black shadow-[4px_4px_0_#000] flex items-center justify-center transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none rounded-none"
                                >
                                    {isPlaying ? <IconPause className="w-6 h-6 text-white" /> : <IconPlay className="w-6 h-6 pl-1 text-white" />}
                                </button>
                                <button onClick={() => playAt(Math.min(duration, currentTime + 10))} className="bg-[var(--color-background)] border-2 border-black p-2 shadow-[2px_2px_0_#000] text-[var(--color-primary-text)] rounded-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                                    <IconForward className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Transcript */}
                    <div className="flex-1 flex flex-col justify-center h-full overflow-hidden w-full">
                        <div className="h-full overflow-y-auto no-scrollbar py-[40vh]" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }}>
                            <div className="font-sans text-lg md:text-2xl leading-[1.4] text-left px-4 space-y-6">
                                {timedLines.map((item, index) => (
                                    <p 
                                        key={index} 
                                        ref={index === activePhraseIndex ? activePhraseRef : null} 
                                        onClick={() => playAt(item.start)}
                                        className={`transition-all duration-500 font-black uppercase tracking-tighter cursor-pointer rounded-none ${index === activePhraseIndex ? 'bg-yellow-300 text-black px-4 py-2 border-l-8 border-black shadow-[4px_4px_0_#000] scale-105' : 'text-[var(--color-muted-text)] scale-95 hover:text-[var(--color-primary-text)]'}`}
                                    >
                                        {item.text}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>

        <footer className="md:hidden p-4 bg-[var(--color-surface)] border-t-4 border-black relative z-20 shadow-[0_-4px_0_#000] rounded-none">
            <div className="max-w-4xl mx-auto w-full space-y-3">
                <div className="h-3 bg-black/10 border-2 border-black relative overflow-hidden rounded-none">
                   <div className="absolute inset-y-0 left-0 bg-cyan-400" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                   <input type="range" min="0" max={duration || 100} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
                <div className="flex justify-between text-[9px] font-black tracking-widest uppercase text-[var(--color-primary-text)]">
                    <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                </div>
            </div>
            {/* Mobile-only playback controls */}
            <div className="flex items-center justify-center gap-6 mt-3">
                <button onClick={() => playAt(Math.max(0, currentTime - 10))} className="bg-[var(--color-background)] border-2 border-black p-2 shadow-[2px_2px_0_#000] text-[var(--color-primary-text)] rounded-none"><IconRewind className="w-5 h-5" /></button>
                <button 
                    onClick={handlePlayPause} 
                    disabled={!isReady}
                    className="w-14 h-14 bg-pink-500 border-4 border-black shadow-[4px_4px_0_#000] flex flex-col items-center justify-center transition-all disabled:opacity-50 rounded-none"
                >
                    {isPlaying ? <IconPause className="w-5 h-5 text-white" /> : <IconPlay className="w-5 h-5 pl-1 text-white" />}
                </button>
                <button onClick={() => playAt(Math.min(duration, currentTime + 10))} className="bg-[var(--color-background)] border-2 border-black p-2 shadow-[2px_2px_0_#000] text-[var(--color-primary-text)] rounded-none"><IconForward className="w-5 h-5" /></button>
            </div>
        </footer>
    </div>
  );
};

export default SummaryView;
