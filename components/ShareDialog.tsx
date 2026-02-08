import React, { useMemo } from 'react';
import { IconClose, IconDownload, IconShare } from './icons';
import type { Theme } from '../types';

interface ShareDialogProps {
    text: string;
    bookTitle: string;
    author: string;
    theme: Theme;
    onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ text, bookTitle, author, theme, onClose }) => {
    const wordCount = useMemo(() => text.trim().split(/\s+/).length, [text]);
    const isTooLong = wordCount > 100;

    const platforms = [
        { 
            name: 'Twitter / X', 
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${text}" — ${author}, ${bookTitle}`)}` 
        },
        { 
            name: 'WhatsApp', 
            url: `https://wa.me/?text=${encodeURIComponent(`"${text}" — ${author}, ${bookTitle}`)}` 
        },
        { 
            name: 'Substack', 
            url: `https://substack.com/refer?text=${encodeURIComponent(`"${text}" — ${author}, ${bookTitle}`)}` 
        }
    ];

    const generateImage = () => {
        if (isTooLong) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High Fidelity Scaling for 4K Ready Output
        const scale = 3;
        const width = 1080 * scale;
        const padding = 80 * scale;
        const borderRadius = 40 * scale;
        
        // Font sizing logic
        let fontSize = 48 * scale;
        if (text.length > 250) fontSize = 42 * scale;
        if (text.length > 500) fontSize = 36 * scale;
        
        const metaFontSize = 22 * scale; // Ultra-small metadata font
        const brandingFontSize = 30 * scale;
        const lineHeight = 1.6;

        // Step 1: Wrap text and calculate body height for dynamic content-hugging
        ctx.font = `${fontSize}px 'Lora', serif`;
        const words = text.split(/\s+/);
        let lines: string[] = [];
        let currentLine = '';
        const maxWidth = width - (padding * 2);

        words.forEach(word => {
            const testLine = currentLine + word + ' ';
            if (ctx.measureText(testLine).width > maxWidth) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        });
        lines.push(currentLine.trim());

        const quoteHeight = lines.length * fontSize * lineHeight;
        const headerAreaHeight = metaFontSize * 4;
        const footerAreaHeight = brandingFontSize * 4;
        
        // Dynamic Height Calculation
        const canvasHeight = Math.round(padding * 2 + headerAreaHeight + quoteHeight + footerAreaHeight);
        
        canvas.width = width;
        canvas.height = canvasHeight;

        // CRITICAL: NO full-canvas fill. Use clearRect to ensure corner transparency in the exported PNG.
        ctx.clearRect(0, 0, width, canvasHeight);

        // Define the rounded frame path
        const borderSize = 3 * scale;
        const r = borderRadius;
        const x = borderSize / 2;
        const y = borderSize / 2;
        const w = width - borderSize;
        const h = canvasHeight - borderSize;

        // 2. Render Rounded Card
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        
        // Background Fill (Internal to the path)
        ctx.fillStyle = theme.colors.background;
        ctx.fill();

        // High-Contrast Visible Border
        ctx.strokeStyle = theme.colors['border-color'];
        ctx.lineWidth = borderSize;
        ctx.stroke();
        
        // Clip so everything else stays inside the rounded frame
        ctx.clip();

        // 3. Header: [Author] in [Book Title]
        // Style: Bold Author, Regular "in", Italic Book
        let cursorX = padding;
        const cursorY = padding;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Author (Bold)
        ctx.font = `700 ${metaFontSize}px 'Inter', sans-serif`;
        ctx.fillStyle = theme.colors['primary-text'];
        ctx.fillText(author, cursorX, cursorY);
        cursorX += ctx.measureText(author).width + (8 * scale);

        // "in"
        ctx.font = `400 ${metaFontSize}px 'Inter', sans-serif`;
        ctx.fillStyle = theme.colors['secondary-text'];
        ctx.fillText("in", cursorX, cursorY);
        cursorX += ctx.measureText("in").width + (10 * scale);

        // Book Title (Italic)
        ctx.font = `italic 400 ${metaFontSize}px 'Lora', serif`;
        ctx.fillStyle = theme.colors['secondary-text'];
        
        let displayTitle = bookTitle;
        const maxTitleWidth = width - cursorX - padding;
        if (ctx.measureText(displayTitle).width > maxTitleWidth) {
            while (ctx.measureText(displayTitle + '...').width > maxTitleWidth && displayTitle.length > 0) {
                displayTitle = displayTitle.slice(0, -1);
            }
            displayTitle += '...';
        }
        ctx.fillText(displayTitle, cursorX, cursorY);

        // 4. Quote Body
        ctx.font = `${fontSize}px 'Lora', serif`;
        ctx.fillStyle = theme.colors['primary-text'];
        ctx.textBaseline = 'top';
        
        const quoteStartY = cursorY + headerAreaHeight + (10 * scale);
        lines.forEach((line, i) => {
            ctx.fillText(line, padding, quoteStartY + (i * fontSize * lineHeight));
        });

        // 5. Footer Branding: The Bookshelf Logo
        const footerY = canvasHeight - padding;
        const logoX = padding;
        const stickW = 4 * scale;
        const stickH = brandingFontSize;
        const stickG = 8 * scale;
        
        ctx.strokeStyle = theme.colors.primary;
        ctx.lineWidth = stickW;
        ctx.lineCap = 'round';
        
        // Bookshelf Logo Implementation
        ctx.beginPath();
        // Stick 1 (Vertical)
        ctx.moveTo(logoX, footerY - stickH);
        ctx.lineTo(logoX, footerY);
        // Stick 2 (Vertical)
        ctx.moveTo(logoX + stickG, footerY - stickH);
        ctx.lineTo(logoX + stickG, footerY);
        // Stick 3 (Leaning)
        ctx.moveTo(logoX + stickG * 2.5, footerY);
        ctx.lineTo(logoX + stickG * 1.5, footerY - stickH * 0.9);
        ctx.stroke();
        
        // Zizhi Typography
        ctx.font = `700 ${brandingFontSize}px 'Lora', serif`;
        ctx.fillStyle = theme.colors['primary-text'];
        ctx.textBaseline = 'bottom';
        ctx.fillText("Zizhi", logoX + (stickG * 3.5), footerY);

        ctx.restore();

        // Export as High-Quality PNG with transparency
        const link = document.createElement('a');
        link.download = `zizhi-insight-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in">
            <div className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-pop-in relative">
                <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <IconClose className="w-4 h-4 text-slate-400" />
                </button>
                
                <div className="p-10 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <IconShare className="w-8 h-8 text-indigo-600" />
                    </div>
                    
                    <h3 className="text-xl font-black mb-1 text-slate-900 uppercase tracking-widest text-center">Share Insight</h3>
                    <p className="text-[9px] text-slate-400 mb-8 font-black uppercase tracking-widest opacity-60 text-center">
                        {isTooLong ? "Selection too long for frame" : "Generating high-fidelity frame"}
                    </p>

                    <div className="space-y-2.5 mb-8">
                        {platforms.map(p => (
                            <a 
                                key={p.name} 
                                href={p.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group"
                            >
                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{p.name}</span>
                                <span className="text-[10px] font-black opacity-10 group-hover:opacity-40 group-hover:translate-x-1 transition-all">→</span>
                            </a>
                        ))}
                    </div>

                    <button 
                        onClick={generateImage}
                        disabled={isTooLong}
                        className={`w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-2xl flex items-center justify-center gap-3 transition-all ${isTooLong ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-95 shadow-xl'}`}
                    >
                        <IconDownload className="w-4 h-4" />
                        Download 4K Frame
                    </button>
                    
                    {isTooLong && (
                        <p className="mt-4 text-[9px] text-red-500 font-black uppercase tracking-[0.2em] animate-pulse">
                            Limit: 100 words per share
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareDialog;