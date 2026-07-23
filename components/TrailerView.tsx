
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// Import Box from @mantine/core to fix missing component error
import { Box } from '@mantine/core';
import { Volume2, VolumeX } from 'lucide-react';
import type { Book, GenerationStatus } from '../types';
import { IconPlay, IconPause, IconClose, IconRewind, IconForward, IconDownload } from './icons';

interface SummaryViewProps {
  book: Book;
  onClose: () => void;
  generationStatus?: GenerationStatus;
}

function decodeBase64(base64: string) {
  if (!base64) return new Uint8Array(0);
  const parts = base64.split(',');
  const binaryString = atob(parts[1] || base64);
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

function generateAmbientPad(ctx: AudioContext, durationSeconds: number, sampleRate: number): AudioBuffer {
  const frameCount = sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Harmonics for a gorgeous major 7th chord (C3, G3, C4, E4, B4)
  const frequencies = [130.81, 196.00, 261.63, 329.63, 493.88];
  const numFreqs = frequencies.length;

  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (let f = 0; f < numFreqs; f++) {
      const freq = frequencies[f];
      // Slow LFO for each frequency to create movement and depth
      const lfoSpeed = 0.08 + f * 0.04;
      const lfoAmp = 0.4 + 0.3 * Math.sin(2 * Math.PI * lfoSpeed * t);
      
      // Warm synthesizer: mix of sine and soft triangle wave
      const sine = Math.sin(2 * Math.PI * freq * t);
      const tri = Math.asin(Math.sin(2 * Math.PI * freq * t)) / (Math.PI / 2);
      
      sample += (sine * 0.7 + tri * 0.3) * lfoAmp * (1 / numFreqs);
    }

    // Add subtle warm tape hiss
    const noise = (Math.random() * 2 - 1) * 0.005;
    
    // Smooth fade-in at start (first 3s) and fade-out at end (last 4s)
    let envelope = 1;
    if (t < 3) {
      envelope = t / 3;
    } else if (t > durationSeconds - 4) {
      envelope = Math.max(0, (durationSeconds - t) / 4);
    }

    // Scale down to a very soft background volume (approx 5% volume)
    channelData[i] = (sample * 0.06 + noise * 0.002) * envelope;
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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const activePhraseRef = useRef<HTMLParagraphElement>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load and configure Web Speech voices, sorting premium/natural ones to the top
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;

    const updateVoices = () => {
      const allVoices = synth.getVoices();
      // Filter English primarily, but preserve others if not English
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
      const listToUse = englishVoices.length > 0 ? englishVoices : allVoices;

      // Sort voices: put "natural", "premium", "neural", "google", "siri" voices first
      const sortedVoices = [...listToUse].sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        
        const aIsPremium = aLower.includes('natural') || aLower.includes('premium') || aLower.includes('neural') || aLower.includes('google') || aLower.includes('siri');
        const bIsPremium = bLower.includes('natural') || bLower.includes('premium') || bLower.includes('neural') || bLower.includes('google') || bLower.includes('siri');

        if (aIsPremium && !bIsPremium) return -1;
        if (!aIsPremium && bIsPremium) return 1;
        return a.name.localeCompare(b.name);
      });

      setVoices(sortedVoices);

      const savedVoice = localStorage.getItem('zizhi-preferred-voice');
      if (savedVoice && sortedVoices.some(v => v.name === savedVoice)) {
        setSelectedVoiceName(savedVoice);
      } else {
        // Default to a premium sounding voice if available
        const defaultVoice = sortedVoices.find(v => {
          const nameLower = v.name.toLowerCase();
          return nameLower.includes('natural') || nameLower.includes('google') || nameLower.includes('premium') || nameLower.includes('neural');
        }) || sortedVoices[0];

        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      }
    };

    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }
  }, []);

  // Calculate high-fidelity duration based on reading speed (approx 135 words per minute)
  const calculatedDuration = useMemo(() => {
    if (!book?.summaryScript) return 60;
    const wordCount = (book.summaryScript || '').split(/\s+/).filter(Boolean).length;
    return Math.max(30, Math.ceil((wordCount / 135) * 60));
  }, [book?.summaryScript]);

  const timedLines = useMemo(() => {
    if (!book?.summaryScript || !duration) return [];
    const processedLines = (book.summaryScript || '').split(/\n\n+/).flatMap(p => p.match(/[^.!?]+[.!?]+/g) || [p]).map(line => line.trim()).filter(l => l.length > 5);
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

  // Init Web Speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  // Sync spoken audio with visual active line
  useEffect(() => {
    if (!isPlaying || !isVoiceEnabled || activePhraseIndex === -1 || !timedLines[activePhraseIndex] || !synthRef.current) {
      synthRef.current?.cancel();
      return;
    }

    try {
      synthRef.current.cancel();

      const textToSpeak = timedLines[activePhraseIndex].text;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = playbackRate * 1.05;
      
      if (selectedVoiceName) {
        const chosenVoice = synthRef.current.getVoices().find(v => v.name === selectedVoiceName);
        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }
      }

      utteranceRef.current = utterance;

      synthRef.current.speak(utterance);
    } catch (e) {
      console.error("TTS failed to speak:", e);
    }

    return () => {
      synthRef.current?.cancel();
    };
  }, [activePhraseIndex, isPlaying, isVoiceEnabled, timedLines, playbackRate, selectedVoiceName]);

  useEffect(() => {
    const initAudio = async () => {
      if (!book.audioSummaryUrl && !book.summaryScript) return;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      try {
        let buffer: AudioBuffer;
        if (book.audioSummaryUrl) {
          const rawBytes = decodeBase64(book.audioSummaryUrl);
          buffer = await decodeAudioData(rawBytes, audioContext, 24000, 1);
          
          // If decoded buffer is a placeholder (i.e. very short duration), generate beautiful lo-fi background track instead
          if (buffer.duration < 2.0) {
            console.log("Generating high-fidelity lo-fi background ambient track of duration:", calculatedDuration);
            buffer = generateAmbientPad(audioContext, calculatedDuration, 24000);
          }
        } else {
          console.log("No audio URL found but script is present. Generating procedural ambient background pad.");
          buffer = generateAmbientPad(audioContext, calculatedDuration, 24000);
        }

        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        setIsReady(true);
      } catch (err) {
        console.error("Audio decoding error, falling back to procedural generation:", err);
        try {
          const buffer = generateAmbientPad(audioContext, calculatedDuration, 24000);
          audioBufferRef.current = buffer;
          setDuration(buffer.duration);
          setIsReady(true);
        } catch (fallbackErr) {
          console.error("Procedural generation fallback failed:", fallbackErr);
        }
      }
    };
    initAudio();
    return () => {
      sourceNodeRef.current?.stop();
      audioContextRef.current?.close();
      cancelAnimationFrame(rafRef.current);
    };
  }, [book.audioSummaryUrl, book.summaryScript, calculatedDuration]);

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

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleDownload = async () => {
    if (!book.audioSummaryUrl || !audioBufferRef.current || !audioContextRef.current) return;
    
    setIsExporting(true);
    setExportProgress(0);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load cover image for canvas
    const coverImg = new Image();
    coverImg.crossOrigin = "anonymous";
    if (book.coverImageUrl) {
        coverImg.src = book.coverImageUrl;
        await new Promise((resolve) => { coverImg.onload = resolve; coverImg.onerror = resolve; });
    }

    const exportStreamDest = audioContextRef.current.createMediaStreamDestination();
    const exportSource = audioContextRef.current.createBufferSource();
    exportSource.buffer = audioBufferRef.current;
    exportSource.connect(exportStreamDest);
    
    const stream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...exportStreamDest.stream.getAudioTracks()
    ]);

    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const recorder = new MediaRecorder(combinedStream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(book?.title || 'Book').replace(/\s+/g, '_')}_Insight.${(mimeType || '').split('/')[1] || 'mp4'}`;
        link.click();
        setIsExporting(false);
    };

    // Rendering loop for video
    let startTime = 0;
    const render = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = (now - startTime) / 1000;
        const progress = elapsed / duration;
        setExportProgress(progress * 100);

        if (elapsed >= duration) {
            recorder.stop();
            exportSource.stop();
            return;
        }

        // Draw background
        ctx.fillStyle = '#fdf6e3'; // Neo Brutalist background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Header
        ctx.fillStyle = '#000';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('INSIGHTS', canvas.width / 2, 60);
        ctx.font = '900 18px sans-serif';
        ctx.fillText(book.title.toUpperCase(), canvas.width / 2, 90);
        ctx.fillRect(0, 120, canvas.width, 4); // Divider

        // Draw Cover
        const coverSize = 300;
        const coverX = 100;
        const coverY = 200;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 8;
        ctx.strokeRect(coverX, coverY, coverSize, coverSize);
        ctx.fillStyle = '#000';
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
        ctx.fillRect(coverX, coverY, coverSize, coverSize);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        if (coverImg.complete && coverImg.naturalWidth > 0) {
            ctx.drawImage(coverImg, coverX, coverY, coverSize, coverSize);
        }

        // Draw Transcript
        const activeLine = timedLines.find(l => elapsed >= l.start && elapsed < l.end);
        if (activeLine) {
            const textX = 500;
            const textY = 300;
            const maxWidth = 680;
            
            ctx.font = '900 32px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            // Draw highlight box
            const words = (activeLine?.text || '').toUpperCase().split(' ');
            let line = '';
            let lines = [];
            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            const lineHeight = 45;
            const boxPadding = 20;
            const boxHeight = lines.length * lineHeight + boxPadding * 2;
            
            ctx.fillStyle = '#000';
            ctx.shadowOffsetX = 8;
            ctx.shadowOffsetY = 8;
            ctx.fillRect(textX - boxPadding, textY - boxPadding, maxWidth + boxPadding * 2, boxHeight);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.fillStyle = '#facc15'; // Yellow-300
            ctx.fillRect(textX - boxPadding, textY - boxPadding, maxWidth + boxPadding * 2, boxHeight);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeRect(textX - boxPadding, textY - boxPadding, maxWidth + boxPadding * 2, boxHeight);

            ctx.fillStyle = '#000';
            lines.forEach((l, i) => {
                ctx.fillText(l, textX, textY + i * lineHeight);
            });
        }

        // Draw Progress Bar
        const barY = 650;
        const barWidth = 1080;
        const barX = 100;
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(barX, barY, barWidth, 20);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeRect(barX, barY, barWidth, 20);
        ctx.fillStyle = '#22d3ee'; // Cyan-400
        ctx.fillRect(barX, barY, barWidth * progress, 20);

        requestAnimationFrame(render);
    };

    recorder.start();
    exportSource.start(0);
    requestAnimationFrame(render);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[var(--color-background)] text-[var(--color-primary-text)] flex flex-col animate-fade-in select-none overflow-hidden">
        {isExporting && (
            <div className="absolute inset-0 z-[3000] bg-black/90 flex flex-col items-center justify-center text-white p-8 text-center">
                <div className="w-24 h-24 border-8 border-white/20 border-t-yellow-300 animate-spin mb-8 rounded-none"></div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Exporting Video</h2>
                <p className="text-xl font-bold text-gray-400 mb-8 max-w-md">Please keep this tab open. We are rendering your insight into a high-quality video...</p>
                <div className="w-full max-w-xl h-8 bg-white/10 border-4 border-white relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-yellow-300 transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                </div>
                <p className="mt-4 font-black text-2xl text-yellow-300">{Math.round(exportProgress)}%</p>
            </div>
        )}
        <header className="p-3 md:p-6 flex items-center justify-between z-20 relative bg-[var(--color-surface)] border-b-4 border-black shadow-[0_4px_0_#000] rounded-none">
            <button onClick={onClose} className="p-2 md:p-3 bg-cyan-400 border-2 border-black shadow-[2px_2px_0_#000] transition-all rounded-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"><IconClose className="w-5 h-5 md:w-6 md:h-6 text-black" /></button>
            <div className="text-center">
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-pink-500">Insights</p>
                <p className="text-[10px] md:text-xs font-black truncate max-w-[150px] md:max-w-[300px] uppercase mt-1 text-[var(--color-primary-text)]">{book.title}</p>
            </div>
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-yellow-300 border-2 border-black shadow-[2px_2px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all rounded-none"
            >
                <IconDownload className="w-4 h-4 md:w-5 md:h-5 text-black" />
                <span className="hidden md:inline text-[10px] font-black uppercase text-black">Download</span>
            </button>
        </header>

        <main className="flex-1 flex flex-col md:flex-row p-4 md:p-8 lg:p-12 gap-6 md:gap-12 items-center md:items-stretch overflow-hidden relative">
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
                <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-center overflow-hidden w-full h-full max-w-7xl mx-auto">
                    {/* Left Column: Cover, Progress, and Controls (Desktop) */}
                    <div className={`flex-col items-center gap-4 md:gap-6 md:w-1/3 lg:w-1/4 ${isPlaying ? 'hidden md:flex' : 'flex'} transition-all duration-300 max-h-full overflow-y-auto no-scrollbar flex-shrink-0`}>
                        <div className="w-32 md:w-full max-w-[240px] aspect-square shadow-[8px_8px_0_#000] border-4 border-black overflow-hidden bg-[var(--color-surface)] rounded-none flex-shrink-0">
                            {book.coverImageUrl && <img src={book.coverImageUrl} className="w-full h-full object-cover" />}
                        </div>
                        
                        {/* Desktop-only playback controls and progress */}
                        <div className="hidden md:flex flex-col items-center gap-6 w-full flex-shrink-0">
                            {/* Progress Bar */}
                            <div className="w-full space-y-2">
                                <div className="h-3 bg-black/10 border-2 border-black relative overflow-hidden rounded-none">
                                   <div className="absolute inset-y-0 left-0 bg-cyan-400" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                                   <input type="range" min="0" max={duration || 100} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                </div>
                                <div className="flex justify-between text-[9px] font-black tracking-widest uppercase text-[var(--color-primary-text)]">
                                    <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                                    <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => playAt(Math.max(0, currentTime - 10))} className="bg-[var(--color-background)] border-2 border-black p-2 shadow-[2px_2px_0_#000] text-[var(--color-primary-text)] rounded-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                                    <IconRewind className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={handlePlayPause} 
                                    className="w-12 h-12 lg:w-14 lg:h-14 bg-pink-500 border-4 border-black shadow-[4px_4px_0_#000] flex items-center justify-center transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none rounded-none"
                                >
                                    {isPlaying ? <IconPause className="w-5 h-5 text-white" /> : <IconPlay className="w-5 h-5 pl-1 text-white" />}
                                </button>
                                <button onClick={() => playAt(Math.min(duration, currentTime + 10))} className="bg-[var(--color-background)] border-2 border-black p-2 shadow-[2px_2px_0_#000] text-[var(--color-primary-text)] rounded-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                                    <IconForward className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} 
                                    className={`border-2 border-black p-2 shadow-[2px_2px_0_#000] rounded-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${isVoiceEnabled ? 'bg-cyan-400 text-black' : 'bg-gray-200 text-gray-500'}`}
                                    title={isVoiceEnabled ? "Mute voice narration" : "Unmute voice narration"}
                                >
                                    {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Voice Selector */}
                            {voices.length > 0 && (
                                <div className="w-full space-y-2 mt-4 px-2">
                                    <label className="text-[10px] font-black tracking-widest uppercase text-[var(--color-primary-text)] block">
                                        Voice narration:
                                    </label>
                                    <select
                                        value={selectedVoiceName}
                                        onChange={(e) => {
                                            setSelectedVoiceName(e.target.value);
                                            localStorage.setItem("zizhi-preferred-voice", e.target.value);
                                            if (isPlaying) {
                                                synthRef.current?.cancel();
                                            }
                                        }}
                                        className="w-full bg-[var(--color-surface)] border-2 border-black p-2 font-mono text-xs rounded-none focus:outline-none shadow-[2px_2px_0_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none transition-all text-[var(--color-primary-text)] cursor-pointer"
                                    >
                                        {voices.map(voice => (
                                            <option key={voice.name} value={voice.name} className="bg-[var(--color-surface)]">
                                                {voice.name} ({voice.lang}) {voice.name.toLowerCase().includes("natural") || voice.name.toLowerCase().includes("google") || voice.name.toLowerCase().includes("premium") || voice.name.toLowerCase().includes("neural") ? "✨" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Transcript */}
                    <div className="flex-1 flex flex-col justify-center h-full overflow-hidden w-full max-w-2xl">
                        <div className="h-full overflow-y-auto no-scrollbar py-[35vh]" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)' }}>
                            <div className="font-sans text-base md:text-xl lg:text-2xl leading-[1.4] text-left px-4 space-y-4 md:space-y-6">
                                {timedLines.map((item, index) => (
                                    <p 
                                        key={index} 
                                        ref={index === activePhraseIndex ? activePhraseRef : null} 
                                        onClick={() => playAt(item.start)}
                                        className={`transition-all duration-500 font-black uppercase tracking-tighter cursor-pointer rounded-none ${index === activePhraseIndex ? 'bg-yellow-300 text-black px-3 py-1.5 md:px-4 md:py-2 border-l-8 border-black shadow-[4px_4px_0_#000] scale-105' : 'text-[var(--color-muted-text)] scale-95 hover:text-[var(--color-primary-text)]'}`}
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
            <div className="flex flex-col items-center gap-3 mt-3">
                <div className="flex items-center justify-center gap-6">
                    <button onClick={() => playAt(Math.max(0, currentTime - 10))} className="bg-[var(--color-background)] border-2 border-black p-2 shadow-[2px_2px_0_#000] text-[var(--color-primary-text)] rounded-none"><IconRewind className="w-5 h-5" /></button>
                    <button 
                        onClick={handlePlayPause} 
                        disabled={!isReady}
                        className="w-14 h-14 bg-pink-500 border-4 border-black shadow-[4px_4px_0_#000] flex flex-col items-center justify-center transition-all disabled:opacity-50 rounded-none"
                    >
                        {isPlaying ? <IconPause className="w-5 h-5 text-white" /> : <IconPlay className="w-5 h-5 pl-1 text-white" />}
                    </button>
                    <button onClick={() => playAt(Math.min(duration, currentTime + 10))} className="bg-[var(--color-background)] border-2 border-black p-2 shadow-[2px_2px_0_#000] text-[var(--color-primary-text)] rounded-none"><IconForward className="w-5 h-5" /></button>
                    <button 
                        onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} 
                        className={`border-2 border-black p-2 shadow-[2px_2px_0_#000] rounded-none ${isVoiceEnabled ? 'bg-cyan-400 text-black' : 'bg-gray-200 text-gray-500'}`}
                    >
                        {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile voice selector */}
                {voices.length > 0 && (
                    <div className="w-full flex items-center justify-between gap-2 px-2">
                        <span className="text-[9px] font-black tracking-widest uppercase text-[var(--color-primary-text)] whitespace-nowrap">Voice:</span>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => {
                            setSelectedVoiceName(e.target.value);
                            localStorage.setItem("zizhi-preferred-voice", e.target.value);
                            if (isPlaying) {
                              synthRef.current?.cancel();
                            }
                          }}
                          className="flex-1 max-w-[200px] bg-[var(--color-background)] border-2 border-black py-1 px-2 font-mono text-[10px] rounded-none focus:outline-none text-[var(--color-primary-text)] cursor-pointer"
                        >
                          {voices.map(voice => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name.replace("Microsoft", "MS").replace("Google", "G")}
                            </option>
                          ))}
                        </select>
                    </div>
                )}
            </div>
        </footer>
    </div>
  );
};

export default SummaryView;
