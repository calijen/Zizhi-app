import { FC, useMemo, useState, useRef, useEffect } from 'react';
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
    { 
        id: 'ruled-college', 
        name: 'College Ruled', 
        bg: '#fcfbf9', 
        text: '#22252a', 
        accent: '#e11d48', // Red margins
        lineColor: '#cbdcf7', // Notebook blue
        font: "'JetBrains Mono', 'Courier New', Courier, monospace",
        fontStyle: 'normal',
        pattern: 'ruled',
        authorFont: "'Lora', Georgia, serif"
    },
    { 
        id: 'ruled-vintage', 
        name: 'Classic Journal', 
        bg: '#faf4e8', 
        text: '#201a15', 
        accent: '#c2410c', // Elegant orange-red
        lineColor: '#e4d5be', 
        font: "'EB Garamond', 'Lora', Georgia, serif", 
        fontStyle: 'italic',
        pattern: 'ruled',
        authorFont: "'Inter', sans-serif"
    },
    { 
        id: 'journal-grid', 
        name: 'Sakura Grid', 
        bg: '#fff5f7', 
        text: '#4a1525', 
        accent: '#f472b6', 
        lineColor: '#fbcfe8', 
        font: "'Lora', Georgia, serif", 
        fontStyle: 'normal',
        pattern: 'grid',
        authorFont: "'JetBrains Mono', monospace"
    },
    { 
        id: 'midnight-terminal', 
        name: 'Midnight Draft', 
        bg: '#0a0d16', 
        text: '#38bdf8', // Neon blue text
        accent: '#f43f5e', 
        lineColor: '#1e293b', 
        font: "'JetBrains Mono', monospace", 
        fontStyle: 'normal',
        pattern: 'ruled',
        authorFont: "'Inter', sans-serif"
    },
    { 
        id: 'minimal-noir', 
        name: 'Cream Card', 
        bg: '#fbfbfa', 
        text: '#000000', 
        accent: '#000000', 
        lineColor: '#e5e5e5', 
        font: "'EB Garamond', 'Lora', Georgia, serif", 
        fontStyle: 'normal',
        pattern: 'none',
        authorFont: "'JetBrains Mono', monospace"
    }
];

const MAX_IMAGE_CHARS = 450;

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

const ShareDialog: FC<ShareDialogProps> = ({ text, bookTitle, author, coverImageUrl, theme, onClose }) => {
    const [step, setStep] = useState<'choice' | 'image' | 'social'>('choice');
    const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
    const [widthMode, setWidthMode] = useState<'wide' | 'square'>('wide');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
        const words = (text || '').split(' ');
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

    const generatePreview = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Base width
        const w = widthMode === 'wide' ? 800 : 640;
        
        // Define sizes depending on mode
        const quoteFontSize = widthMode === 'wide' ? 26 : 22;
        const authorFontSize = widthMode === 'wide' ? 15 : 13;
        
        ctx.font = `${selectedPreset.fontStyle} ${quoteFontSize}px ${selectedPreset.font}`;
        
        // Notebook formatting metrics
        const leftMargin = selectedPreset.pattern === 'ruled' ? 100 : 64;
        const rightMargin = 64;
        const contentW = w - leftMargin - rightMargin;
        
        // Prepend and append curly quotes as requested
        const formattedQuoteText = `“${text}”`;
        const lines = wrapText(ctx, formattedQuoteText, contentW);
        
        // Calculate layouts dynamically to ensure 100% safety from overlap
        const lineSpacing = quoteFontSize + 14; 
        const textStartY = 110;
        const quoteHeight = lines.length * lineSpacing;
        
        const gapToAttribution = 42;
        const attributionStartY = textStartY + quoteHeight + gapToAttribution;
        const paddingBottom = 70;
        
        // Total height calculation
        const h = Math.max(400, attributionStartY + authorFontSize * 2 + 15 + paddingBottom);
        
        // Set scale for Retina sharp rendering
        const scale = 2;
        canvas.width = w * scale;
        canvas.height = h * scale;
        ctx.scale(scale, scale);

        // 1. Background Fill
        ctx.fillStyle = selectedPreset.bg;
        ctx.fillRect(0, 0, w, h);

        // 2. Draw ruled notebook lines or grid lines
        if (selectedPreset.pattern === 'ruled') {
            ctx.strokeStyle = selectedPreset.lineColor;
            ctx.lineWidth = 1;
            
            // Generate rules all the way down
            const totalLinesCount = Math.floor(h / lineSpacing) + 2;
            for (let i = 0; i < totalLinesCount; i++) {
                const lineY = textStartY + (i * lineSpacing) - 4; 
                if (lineY > 20 && lineY < h - 45) {
                    ctx.beginPath();
                    ctx.moveTo(0, lineY);
                    ctx.lineTo(w, lineY);
                    ctx.stroke();
                }
            }

            // Draw vertical left notebook red margin line
            ctx.strokeStyle = selectedPreset.accent;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(leftMargin - 24, 0);
            ctx.lineTo(leftMargin - 24, h);
            ctx.stroke();
        } 
        else if (selectedPreset.pattern === 'grid') {
            ctx.strokeStyle = selectedPreset.lineColor;
            ctx.lineWidth = 0.5;
            const gridSize = 24;
            
            // Vertical
            for (let x = gridSize; x < w; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            // Horizontal
            for (let y = gridSize; y < h; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            
            // Red margin
            ctx.strokeStyle = selectedPreset.accent;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(leftMargin - 20, 0);
            ctx.lineTo(leftMargin - 20, h);
            ctx.stroke();
        }
        else {
            // Minimal frame border box
            ctx.strokeStyle = selectedPreset.lineColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 20, w - 40, h - 40);
            
            ctx.fillStyle = selectedPreset.accent;
            ctx.fillRect(20, 20, 6, 60);
        }

        // 3. Render Quote Text with exact notebook baseline alignment
        ctx.fillStyle = selectedPreset.text;
        ctx.font = `${selectedPreset.fontStyle} ${quoteFontSize}px ${selectedPreset.font}`;
        ctx.textAlign = 'left';

        if (selectedPreset.pattern === 'ruled') {
            // Align baseline beautifully directly to notebook lines
            ctx.textBaseline = 'bottom';
            lines.forEach((line, i) => {
                const renderY = textStartY + (i * lineSpacing) - 6;
                ctx.fillText(line, leftMargin, renderY);
            });
        } else {
            ctx.textBaseline = 'top';
            lines.forEach((line, i) => {
                const renderY = textStartY + (i * lineSpacing);
                ctx.fillText(line, leftMargin, renderY);
            });
        }

        // 4. Render minimal source attribution
        ctx.textBaseline = 'top';
        const attributionText = `— ${author}`;
        const sourceText = `from "${bookTitle}"`;

        // Bold pristine Author name
        ctx.font = `bold ${authorFontSize}px ${selectedPreset.authorFont}`;
        ctx.fillStyle = selectedPreset.text;
        ctx.globalAlpha = 0.95;
        ctx.fillText(attributionText, leftMargin, attributionStartY);

        // Italic subtitle book source
        ctx.font = `italic ${authorFontSize - 1}px ${selectedPreset.authorFont}`;
        ctx.globalAlpha = 0.65;
        ctx.fillText(sourceText, leftMargin + 10, attributionStartY + authorFontSize + 6);
        ctx.globalAlpha = 1.0;

        // 5. Subtle Branding watermark (Unique to Zizhi)
        ctx.font = `bold 10px 'JetBrains Mono', monospace`;
        ctx.fillStyle = selectedPreset.text;
        ctx.globalAlpha = 0.25;
        ctx.textAlign = 'right';
        ctx.fillText('ZIZHI BINDER', w - rightMargin, h - 36);
        ctx.globalAlpha = 1.0;

        setPreviewUrl(canvas.toDataURL());
    };

    useEffect(() => {
        if (step === 'image') {
            generatePreview();
        }
    }, [selectedPreset, widthMode, text, step]);

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
        { 
            name: 'WhatsApp', 
            color: '#25D366',
            getShareUrl: (t: string, a: string, b: string) => `https://wa.me/?text=${encodeURIComponent(`“${t}” — ${a}, from ${b}`)}`
        },
        { 
            name: 'Twitter', 
            color: '#000000',
            getShareUrl: (t: string, a: string, b: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(`“${t}” — ${a}, from ${b}`)}`
        },
        { 
            name: 'Facebook', 
            color: '#1877F2',
            getShareUrl: (t: string, a: string, b: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(`“${t}” — ${a}, from ${b}`)}`
        },
        { 
            name: 'Substack', 
            color: '#FF6719',
            getShareUrl: null
        }
    ];

    const handleSocialShare = (platform: typeof socialPlatforms[0]) => {
        if (platform.getShareUrl) {
            window.open(platform.getShareUrl(text, author, bookTitle), '_blank');
        } else {
            copyToClipboard();
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="w-full max-w-lg bg-white border-8 border-black shadow-[12px_12px_0_black] flex flex-col relative animate-pop-in my-8 max-h-[90vh]">
                
                {/* Always-accessible Internal Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 w-10 h-10 bg-red-500 border-4 border-black text-white flex items-center justify-center shadow-[3px_3px_0_black] hover:translate-y-0.5 active:shadow-none transition-all z-50 hover:bg-red-600"
                    aria-label="Close dialog"
                >
                    <IconClose className="w-5 h-5 font-black" />
                </button>

                <div className="flex-1 overflow-y-auto">
                    {step === 'choice' && (
                        <div className="p-6 md:p-10 space-y-8">
                            <header className="text-center space-y-2 pr-10">
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-left">Share Insight</h2>
                                <p className="text-[10px] font-black uppercase text-black/60 tracking-widest text-left">Select your sharing medium</p>
                            </header>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => setStep('image')}
                                    className="group p-6 border-4 border-black bg-cyan-400 shadow-[4px_4px_0_black] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_black] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center gap-3 text-left"
                                >
                                    <IconDownload className="w-8 h-8 text-black" />
                                    <span className="font-black uppercase tracking-widest text-sm text-black">Generate Notebook Card</span>
                                </button>
                                <button 
                                    onClick={() => setStep('social')}
                                    className="group p-6 border-4 border-black bg-white shadow-[4px_4px_0_black] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_black] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center gap-3"
                                >
                                    <IconShare className="w-8 h-8 text-black" />
                                    <span className="font-black uppercase tracking-widest text-sm text-black">Post to Social Hubs</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'social' && (
                        <div className="p-6 md:p-8 space-y-6">
                            <header className="flex items-center justify-between border-b-2 border-black pb-3 pr-10">
                                <button onClick={() => setStep('choice')} className="text-[11px] font-black uppercase underline hover:text-cyan-600 transition-colors">← Back</button>
                                <h3 className="text-lg font-black uppercase italic">Social Hub</h3>
                                <div className="w-4"></div>
                            </header>
                            
                            <div className="p-5 bg-slate-50 border-4 border-black font-serif italic text-sm text-black shadow-inner max-h-36 overflow-y-auto">
                                “{text}”
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {socialPlatforms.map(platform => (
                                    <button 
                                        key={platform.name}
                                        onClick={() => handleSocialShare(platform)}
                                        className="p-3.5 border-4 border-black font-black uppercase text-[10px] flex items-center justify-between hover:bg-slate-100 active:translate-y-0.5 transition-all shadow-[2px_2px_0_black]"
                                        style={{ color: 'black' }}
                                    >
                                        <span>{platform.name}</span>
                                        <div className="p-1 bg-white border-2 border-black rounded-xs" style={{ color: platform.color }}>
                                            <SocialIcon type={platform.name} />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={copyToClipboard}
                                className="w-full py-4 bg-yellow-400 border-4 border-black font-black uppercase tracking-widest shadow-[4px_4px_0_black] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_black] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 text-black text-xs"
                            >
                                <IconCopy className="w-4 h-4" /> Copy Quote Text
                            </button>
                        </div>
                    )}

                    {step === 'image' && (
                        <div className="flex flex-col">
                            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-white pr-12 shrink-0">
                                <button onClick={() => setStep('choice')} className="text-[11px] font-black uppercase underline hover:text-cyan-600 transition-colors">← Back</button>
                                <h3 className="text-[11px] font-black uppercase tracking-widest italic text-center">Visual Customizer</h3>
                                <div className="w-4"></div>
                            </div>

                            {/* Canvas Preview Box */}
                            <div className="p-4 bg-slate-200 border-b-4 border-black flex flex-col items-center justify-center min-h-[220px] max-h-[300px] overflow-y-auto relative">
                                {text.length > MAX_IMAGE_CHARS && (
                                    <div className="absolute inset-0 z-10 bg-red-500/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                                        <h4 className="text-xl font-black uppercase text-white italic tracking-tighter">Text Too Long</h4>
                                        <p className="text-white font-bold text-xs leading-snug uppercase max-w-xs">
                                            Visual cards are limited to {MAX_IMAGE_CHARS} characters for notebook readability. 
                                            Yours is {text.length}.
                                        </p>
                                        <button 
                                            onClick={() => setStep('choice')}
                                            className="px-4 py-2.5 bg-black text-white border-4 border-black font-black uppercase text-[10px] shadow-[3px_3px_0_white] hover:translate-y-0.5 hover:shadow-none transition-all"
                                        >
                                            Go Back & Copy Text Instead
                                        </button>
                                    </div>
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                                {previewUrl && (
                                    <img src={previewUrl} className="w-full h-auto border-4 border-black shadow-[6px_6px_0_black] bg-white max-h-[240px] object-contain" alt="Notebook card preview" />
                                )}
                            </div>

                            {/* Options controls */}
                            <div className="p-5 space-y-4 bg-white">
                                {/* Preset circles/squares */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] uppercase tracking-wider font-sans font-black text-black/60 block text-center">
                                        Paper Type presets
                                    </span>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {PRESETS.map((p) => (
                                            <button 
                                                key={p.name}
                                                onClick={() => setSelectedPreset(p)}
                                                className={`px-2.5 py-1.5 rounded-none border-2 border-black font-black uppercase text-[9px] tracking-wider transition-all ${selectedPreset.id === p.id ? 'bg-yellow-300 shadow-[2px_2px_0_black] -translate-y-0.5' : 'bg-transparent text-black/70 hover:text-black hover:border-black'}`}
                                                style={{ borderLeftColor: p.accent, borderLeftWidth: '4px' }}
                                                title={p.name}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center justify-between border-t border-black/10 pt-2.5">
                                        <span className="text-[9px] uppercase font-black text-black/50">Width Mode:</span>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => setWidthMode('wide')}
                                                className={`px-3 py-1 border-2 border-black text-[9px] font-black uppercase ${widthMode === 'wide' ? 'bg-black text-white' : 'bg-transparent text-black'}`}
                                            >
                                                Wide (800px)
                                            </button>
                                            <button 
                                                onClick={() => setWidthMode('square')}
                                                className={`px-3 py-1 border-2 border-black text-[9px] font-black uppercase ${widthMode === 'square' ? 'bg-black text-white' : 'bg-transparent text-black'}`}
                                            >
                                                Square (640px)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleDownload}
                                    disabled={text.length > MAX_IMAGE_CHARS}
                                    className={`w-full py-3.5 font-black uppercase tracking-widest text-xs border-4 border-black transition-all flex items-center justify-center gap-2 ${text.length > MAX_IMAGE_CHARS ? 'bg-gray-150 text-gray-400 cursor-not-allowed opacity-50' : 'bg-black text-white shadow-[4px_4px_0_cyan] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_cyan] active:translate-y-0.5 active:shadow-none'}`}
                                >
                                    <IconDownload className="w-4 h-4" /> Export Notebook Page
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareDialog;
