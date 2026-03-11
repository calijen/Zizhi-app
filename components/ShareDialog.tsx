
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { IconClose, IconDownload, IconShare, IconCopy } from './icons';
import type { Theme } from '../types';

interface ShareDialogProps {
    text: string;
    bookTitle: string;
    author: string;
    coverImageUrl?: string | null;
    theme: Theme;
    onClose: () => void;
}

const PRESETS = [
    { name: 'Sky', bg: '#7096c1', text: '#ffffff' },
    { name: 'Midnight', bg: '#0b162a', text: '#ffffff' },
    { name: 'Vapor', bg: '#d0e3f5', text: '#0b162a' },
    { name: 'Ocean', bg: '#1e3a5f', text: '#ffffff' },
    { name: 'Cloud', bg: '#ffffff', text: '#0b162a' },
    { name: 'Ink', bg: '#1a1a1a', text: '#ffffff' },
];

const SocialIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'WhatsApp':
            return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
        case 'Twitter':
            return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
        case 'Substack':
            return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.539 8.242H1.46V5.406h21.078v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.078V0z"/></svg>;
        case 'Facebook':
            return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
        default:
            return null;
    }
};

const ShareDialog: React.FC<ShareDialogProps> = ({ text, bookTitle, author, coverImageUrl, theme, onClose }) => {
    const [step, setStep] = useState<'choice' | 'image' | 'social'>('choice');
    const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
    const [layout, setLayout] = useState<'pretty' | 'classic'>('pretty');
    const [widthMode, setWidthMode] = useState<'wide' | 'square'>('wide');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const generatePreview = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scale = 2; 
        const w = widthMode === 'wide' ? 800 : 600;
        const h = layout === 'pretty' ? 450 : 600;
        
        canvas.width = w * scale;
        canvas.height = h * scale;
        ctx.scale(scale, scale);

        ctx.fillStyle = selectedPreset.bg;
        ctx.fillRect(0, 0, w, h);

        const padding = 40;
        const contentW = w - padding * 2;
        
        if (layout === 'pretty') {
            const coverW = 180;
            const coverH = 260;
            const textW = contentW - coverW - 40;

            if (coverImageUrl) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.4)';
                    ctx.shadowBlur = 30;
                    ctx.drawImage(img, w - padding - coverW, (h - coverH) / 2, coverW, coverH);
                    ctx.restore();
                    setPreviewUrl(canvas.toDataURL());
                };
                img.src = coverImageUrl;
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(w - padding - coverW, (h - coverH) / 2, coverW, coverH);
            }

            ctx.fillStyle = selectedPreset.text;
            ctx.font = `italic 700 22px 'Lora', serif`;
            const lines = wrapText(ctx, `“${text}”`, textW);
            lines.slice(0, 8).forEach((line, i) => {
                ctx.fillText(line, padding + 10, padding + 60 + (i * 32));
            });

            ctx.font = `900 12px 'Inter', sans-serif`;
            ctx.fillText(bookTitle.toUpperCase(), padding + 10, h - padding - 20);
            ctx.font = `400 10px 'Inter', sans-serif`;
            ctx.globalAlpha = 0.6;
            ctx.fillText(author.toUpperCase(), padding + 10, h - padding - 5);
            ctx.globalAlpha = 1;

            ctx.fillStyle = selectedPreset.text;
            ctx.fillRect(padding - 5, padding + 60, 4, 100);
        } else {
            ctx.textAlign = 'center';
            ctx.fillStyle = selectedPreset.text;
            ctx.font = `italic 700 26px 'Lora', serif`;
            const lines = wrapText(ctx, `“${text}”`, contentW);
            const startY = (h / 2) - (lines.length * 36 / 2);
            lines.forEach((line, i) => {
                ctx.fillText(line, w / 2, startY + (i * 40));
            });
            
            ctx.font = `900 12px 'Inter', sans-serif`;
            ctx.fillText(`— ${author}, ${bookTitle} —`.toUpperCase(), w / 2, h - padding);
        }

        setPreviewUrl(canvas.toDataURL());
    };

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    useEffect(() => {
        if (step === 'image') generatePreview();
    }, [selectedPreset, layout, widthMode, text, step]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = `zizhi-insight-${Date.now()}.png`;
        link.href = previewUrl || '';
        link.click();
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`“${text}” — ${author}, from ${bookTitle}`);
    };

    const socialPlatforms = [
        { name: 'WhatsApp', color: '#25D366' },
        { name: 'Twitter', color: '#000000' },
        { name: 'Substack', color: '#FF6719' },
        { name: 'Facebook', color: '#1877F2' }
    ];

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg bg-white border-8 border-black shadow-[12px_12px_0_black] flex flex-col relative animate-pop-in">
                
                <button 
                    onClick={onClose} 
                    className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 border-4 border-black text-white flex items-center justify-center shadow-[4px_4px_0_black] hover:translate-y-1 hover:shadow-none transition-all z-50"
                    aria-label="Close dialog"
                >
                    <IconClose className="w-8 h-8" />
                </button>

                {step === 'choice' && (
                    <div className="p-10 space-y-10">
                        <header className="text-center space-y-3">
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Share Insight</h2>
                            <p className="text-[11px] font-black uppercase text-black/60 tracking-widest">Select your delivery method</p>
                        </header>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <button 
                                onClick={() => setStep('image')}
                                className="group p-8 border-4 border-black bg-cyan-400 shadow-[6px_6px_0_black] hover:translate-y-[-4px] hover:shadow-[10px_10px_0_black] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center gap-4"
                            >
                                <IconDownload className="w-10 h-10 text-black" />
                                <span className="font-black uppercase tracking-widest text-base text-black">Download Visual Frame</span>
                            </button>
                            <button 
                                onClick={() => setStep('social')}
                                className="group p-8 border-4 border-black bg-white shadow-[6px_6px_0_black] hover:translate-y-[-4px] hover:shadow-[10px_10px_0_black] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center gap-4"
                            >
                                <IconShare className="w-10 h-10 text-black" />
                                <span className="font-black uppercase tracking-widest text-base text-black">Post to Social Hubs</span>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'social' && (
                    <div className="p-8 space-y-8">
                        <header className="flex items-center justify-between">
                            <button onClick={() => setStep('choice')} className="text-[12px] font-black uppercase underline hover:text-cyan-600 transition-colors">← Back</button>
                            <h3 className="text-2xl font-black uppercase italic">Social Hub</h3>
                            <div className="w-10"></div>
                        </header>
                        
                        <div className="p-6 bg-slate-50 border-4 border-black font-serif italic text-base text-black shadow-inner">
                            “{text.length > 150 ? text.slice(0, 150) + '...' : text}”
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {socialPlatforms.map(platform => (
                                <button 
                                    key={platform.name}
                                    onClick={copyToClipboard}
                                    className="p-5 border-4 border-black font-black uppercase text-[11px] flex items-center justify-between hover:bg-slate-100 active:translate-y-1 transition-all shadow-[2px_2px_0_black]"
                                    style={{ color: 'black' }}
                                >
                                    <span>{platform.name}</span>
                                    <div className="p-1.5 bg-white border-2 border-black rounded-sm" style={{ color: platform.color }}>
                                        <SocialIcon type={platform.name} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={copyToClipboard}
                            className="w-full py-5 bg-yellow-400 border-4 border-black font-black uppercase tracking-[0.2em] shadow-[6px_6px_0_black] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 text-black text-sm"
                        >
                            <IconCopy className="w-5 h-5" /> Copy Insight Text
                        </button>
                    </div>
                )}

                {step === 'image' && (
                    <div className="flex flex-col">
                        <div className="p-4 border-b-4 border-black flex items-center justify-between bg-white">
                            <button onClick={() => setStep('choice')} className="text-[12px] font-black uppercase underline hover:text-cyan-600 transition-colors">← Back</button>
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] italic">Visual Customizer</h3>
                            <div className="w-12"></div>
                        </div>

                        <div className="p-6 bg-slate-200 border-b-4 border-black flex items-center justify-center min-h-[300px]">
                            <canvas ref={canvasRef} className="hidden" />
                            {previewUrl && (
                                <img src={previewUrl} className="w-full h-auto border-4 border-black shadow-[10px_10px_0_black] bg-white" alt="Preview" />
                            )}
                        </div>

                        <div className="p-8 space-y-6 bg-white">
                            <div className="flex flex-wrap gap-3 justify-center">
                                {PRESETS.map((p) => (
                                    <button 
                                        key={p.name}
                                        onClick={() => setSelectedPreset(p)}
                                        className={`w-10 h-10 rounded-none border-4 border-black transition-all ${selectedPreset.name === p.name ? 'scale-110 shadow-[4px_4px_0_black] -translate-y-1' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                                        style={{ backgroundColor: p.bg }}
                                        title={p.name}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setLayout(l => l === 'pretty' ? 'classic' : 'pretty')}
                                    className={`py-4 border-4 border-black font-black uppercase text-[11px] tracking-widest transition-all ${layout === 'pretty' ? 'bg-pink-500 text-white shadow-[4px_4px_0_black] -translate-y-1' : 'bg-white text-black'}`}
                                >
                                    {layout === 'pretty' ? 'Pretty Mode' : 'Classic Mode'}
                                </button>
                                <button 
                                    onClick={() => setWidthMode(w => w === 'wide' ? 'square' : 'wide')}
                                    className={`py-4 border-4 border-black font-black uppercase text-[11px] tracking-widest transition-all ${widthMode === 'wide' ? 'bg-cyan-400 text-black shadow-[4px_4px_0_black] -translate-y-1' : 'bg-white text-black'}`}
                                >
                                    {widthMode === 'wide' ? 'Wide' : 'Square'}
                                </button>
                            </div>

                            <button 
                                onClick={handleDownload}
                                className="w-full py-5 bg-black text-white font-black uppercase tracking-[0.2em] text-sm border-4 border-black shadow-[6px_6px_0_cyan] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_cyan] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                            >
                                <IconDownload className="w-5 h-5" /> Export Final Frame
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareDialog;
