import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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

  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

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
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(() => {});
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, [book.audioSummaryUrl]);

  const updateProgress = useCallback(() => {
    if (!audioContextRef.current || !isPlaying || isRecording) return;
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
  }, [isPlaying, duration, isRecording]);

  useEffect(() => {
    if (isPlaying && !isRecording) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else {
        cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, updateProgress, isRecording]);

  const handlePlayPause = () => {
    if (!audioBufferRef.current || !audioContextRef.current || isRecording) return;
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
    if (index !== -1 && index !== activePhraseIndex) {
        setActivePhraseIndex(index);
        const el = document.getElementById(`phrase-${index}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [currentTime, timedLines, activePhraseIndex]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRecording) return;
    const time = parseFloat(e.target.value);
    pauseTimeRef.current = time;
    if (isPlaying) {
        playAt(time);
    } else {
        setCurrentTime(time);
    }
  };

  const handleDownloadVideo = async () => {
      if (!audioBufferRef.current || !audioContextRef.current || isRecording) return;
      setIsRecording(true);
      setRecordingProgress(0);

      if (isPlaying) {
          sourceNodeRef.current?.stop();
          setIsPlaying(false);
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stream = canvas.captureStream(30);
      const dest = audioContextRef.current.createMediaStreamDestination();
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(dest);
      source.connect(audioContextRef.current.destination); // Let user hear the render playback

      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${book.title}_Summary.webm`;
          a.click();
          setIsRecording(false);
          setRecordingProgress(0);
          sourceNodeRef.current = null;
      };

      recorder.start();
      source.start(0);
      const startRecordTime = audioContextRef.current.currentTime;
      const totalDuration = audioBufferRef.current.duration;

      let frameId: number;
      const renderFrame = () => {
          const now = audioContextRef.current!.currentTime;
          const elapsed = now - startRecordTime;
          setRecordingProgress(elapsed / totalDuration);
          setCurrentTime(elapsed); // Updates UI during recording too

          if (elapsed >= totalDuration) {
              source.stop();
              return;
          }

          // Background
          ctx.fillStyle = '#fdf6e3'; 
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const line = timedLines.find(l => elapsed >= l.start && elapsed < l.end);
          const textToDraw = line ? line.text : book.title;

          // Active Text styling
          ctx.fillStyle = '#1a110a';
          ctx.font = '900 64px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const words = textToDraw.split(' ');
          let tempLine = '';
          const lines = [];
          for(let n = 0; n < words.length; n++) {
              const testLine = tempLine + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > canvas.width - 200 && n > 0) {
                  lines.push(tempLine);
                  tempLine = words[n] + ' ';
              } else {
                  tempLine = testLine;
              }
          }
          lines.push(tempLine);

          // Brutalist Box for Text
          const blockHeight = lines.length * 80 + 120;
          ctx.fillStyle = '#f472b6'; // pink-400
          ctx.fillRect(100, canvas.height/2 - blockHeight/2, canvas.width - 200, blockHeight);
          ctx.lineWidth = 12;
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(100, canvas.height/2 - blockHeight/2, canvas.width - 200, blockHeight);
          
          ctx.fillStyle = '#000000';
          let y = canvas.height / 2 - (lines.length * 80) / 2 + 40;
          for(let i = 0; i < lines.length; i++) {
              ctx.fillText(lines[i], canvas.width / 2, y);
              y += 80;
          }

          // Progress Bar overlay
          ctx.fillStyle = '#22d3ee'; // cyan
          ctx.fillRect(100, canvas.height - 200, (elapsed / totalDuration) * (canvas.width - 200), 40);
          ctx.strokeRect(100, canvas.height - 200, canvas.width - 200, 40);

          if (recorder.state === 'recording') {
              frameId = requestAnimationFrame(renderFrame);
          }
      };

      requestAnimationFrame(renderFrame);

      source.onended = () => {
          recorder.stop();
          cancelAnimationFrame(frameId);
      };
  };

  const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[var(--color-surface)] text-[var(--color-primary-text)] flex flex-col animate-fade-in select-none">
        
        {/* Top Nav */}
        <header className="p-4 flex items-center justify-between z-20 bg-white border-b-4 border-black shadow-[0_4px_0_#000]">
            <button onClick={onClose} disabled={isRecording} className="p-2 bg-pink-500 border-4 border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
                <IconClose className="w-6 h-6 text-black" />
            </button>
            <div className="text-center truncate px-4 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-muted-text)]">Summary</p>
                <p className="text-sm font-black truncate uppercase text-[var(--color-primary-text)]">{book.title}</p>
            </div>
            <button onClick={() => {
                if (isRecording) return;
                const speeds = [1, 1.25, 1.5, 2];
                const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
                setPlaybackRate(next);
                if (sourceNodeRef.current) sourceNodeRef.current.playbackRate.value = next;
            }} 
            disabled={isRecording}
            className="w-12 h-12 bg-yellow-400 border-4 border-black flex items-center justify-center text-[12px] font-black shadow-[4px_4px_0_#000] text-black disabled:opacity-50">
                {playbackRate}X
            </button>
        </header>

        {/* Main Content -> Desktop split, Mobile stacked */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[var(--color-background)]">
            
            {!isReady ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 border-8 border-black border-t-cyan-400 animate-spin mb-6"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-text)]">Loading summary...</p>
                </div>
            ) : !userInteracted && !isRecording ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 p-6">
                     <div className="w-48 aspect-square border-4 border-black shadow-[12px_12px_0_black] bg-white">
                        <img src={book.coverImageUrl || ''} className="w-full h-full object-cover" />
                     </div>
                     <button 
                        onClick={() => { setUserInteracted(true); playAt(0); }}
                        className="px-10 py-5 bg-cyan-400 text-black font-black border-4 border-black shadow-[8px_8px_0_black] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all uppercase tracking-widest text-xl"
                     >
                         Start Playback
                     </button>
                 </div>
            ) : (
                <div className="flex-1 max-w-3xl mx-auto w-full h-full overflow-y-auto no-scrollbar p-6 md:p-12 pb-64 space-y-6 scroll-smooth">
                    {/* Transcript reading view */}
                    {timedLines.map((item, index) => {
                        const isActive = index === activePhraseIndex;
                        return (
                            <p 
                                id={`phrase-${index}`}
                                key={index} 
                                onClick={() => { if (!isRecording) playAt(item.start); }}
                                className={`transition-all duration-300 font-serif text-xl md:text-3xl leading-relaxed cursor-pointer p-4 border-l-8 ${isActive ? 'bg-yellow-400 text-black border-black shadow-[6px_6px_0_black] font-black scale-[1.02]' : 'border-transparent text-[var(--color-muted-text)] hover:text-black opacity-80'}`}
                            >
                                {item.text}
                            </p>
                        );
                    })}
                </div>
            )}
        </main>

        {/* Bottom Player */}
        <footer className="bg-white border-t-4 border-black p-4 md:p-6 shadow-[0_-8px_0_var(--color-border-color)] absolute bottom-0 w-full z-30">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Progress bar */}
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black w-10 text-right">{formatTime(currentTime)}</span>
                    <div className="flex-1 h-8 bg-[var(--color-surface)] border-4 border-black relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                       <div className="absolute inset-y-0 left-0 bg-cyan-400 border-r-4 border-black" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                       <input type="range" min="0" max={duration || 100} step="0.1" value={currentTime} onChange={handleSeek} disabled={isRecording} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed" />
                    </div>
                    <span className="text-xs font-black w-10">{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-6">
                        <button onClick={() => playAt(Math.max(0, currentTime - 10))} disabled={isRecording || !isReady} className="p-3 bg-[var(--color-surface)] border-4 border-black shadow-[4px_4px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
                            <IconRewind className="w-6 h-6 text-black" />
                        </button>
                        <button 
                            onClick={handlePlayPause} 
                            disabled={!isReady || isRecording}
                            className="w-20 h-20 bg-pink-500 border-4 border-black shadow-[6px_6px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            {isPlaying && !isRecording ? <IconPause className="w-8 h-8 text-black" /> : <IconPlay className="w-8 h-8 pl-1 text-black" />}
                        </button>
                        <button onClick={() => playAt(Math.min(duration, currentTime + 10))} disabled={isRecording || !isReady} className="p-3 bg-[var(--color-surface)] border-4 border-black shadow-[4px_4px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
                            <IconForward className="w-6 h-6 text-black" />
                        </button>
                    </div>

                    {/* Download Button */}
                    <button 
                        onClick={handleDownloadVideo} 
                        disabled={isRecording || !isReady} 
                        className={`px-6 py-4 border-4 border-black font-black uppercase text-sm md:text-base flex items-center gap-2 shadow-[6px_6px_0_black] transition-all
                            ${isRecording ? 'bg-yellow-400 text-black cursor-wait tracking-widest' : 'bg-black text-white hover:-translate-y-1 hover:-translate-x-1 active:translate-x-1 active:translate-y-1 active:shadow-none'}`}
                    >
                        {isRecording ? `Encoding ${Math.round(recordingProgress * 100)}%` : "Save Video"}
                    </button>
                </div>

            </div>
        </footer>
    </div>
  );
};

export default SummaryView;
