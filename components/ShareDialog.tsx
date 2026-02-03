
import React from 'react';
import { IconClose, IconDownload } from './icons';

interface ShareDialogProps {
    text: string;
    bookTitle: string;
    author: string;
    onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ text, bookTitle, author, onClose }) => {
    
    const shareToTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${text}" — ${bookTitle} by ${author}`)}`;
        window.open(url, '_blank');
        onClose();
    };

    const shareToFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        onClose();
    };

    const downloadAsImage = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuration
        const width = 1080;
        const padding = 80;
        const fontSize = 42;
        const lineHeight = 1.6;
        
        // Measure text wrapping
        ctx.font = `italic ${fontSize}px Lora, Georgia, serif`;
        const words = text.split(' ');
        let lines: string[] = [];
        let currentLine = '';
        const maxWidth = width - (padding * 2);

        words.forEach(word => {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
                lines.push(currentLine);
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        });
        lines.push(currentLine);

        const height = (lines.length * fontSize * lineHeight) + (padding * 4) + 120;
        canvas.width = width;
        canvas.height = height;

        // Draw Background
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#fdf6e3');
        grad.addColorStop(1, '#eee8d5');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Draw Quote Text
        ctx.fillStyle = '#433422';
        ctx.font = `italic ${fontSize}px Lora, Georgia, serif`;
        ctx.textAlign = 'center';
        lines.forEach((line, i) => {
            ctx.fillText(line.trim(), width/2, padding * 2 + (i * fontSize * lineHeight));
        });

        // Draw Attribution
        ctx.font = `bold 28px Inter, sans-serif`;
        ctx.fillStyle = '#704214';
        ctx.fillText(`— ${author}`, width/2, height - padding * 1.8);
        ctx.font = `24px Inter, sans-serif`;
        ctx.fillStyle = '#966032';
        ctx.fillText(bookTitle, width/2, height - padding * 1.3);

        // Download
        const link = document.createElement('a');
        link.download = `zizhi-quote-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up-centered relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                    <IconClose className="w-5 h-5" />
                </button>
                
                <div className="p-10 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Share this insight</h3>
                    <p className="text-sm text-gray-500 mb-8 italic">"{text.slice(0, 60)}..."</p>

                    <div className="grid grid-cols-1 gap-3">
                        <button onClick={shareToTwitter} className="w-full py-3.5 bg-[#1DA1F2] text-white font-bold rounded-2xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all">
                            Post to Twitter
                        </button>
                        <button onClick={shareToFacebook} className="w-full py-3.5 bg-[#4267B2] text-white font-bold rounded-2xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all">
                            Share on Facebook
                        </button>
                        <button onClick={downloadAsImage} className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            <IconDownload className="w-5 h-5" />
                            <span>Download as Image</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareDialog;
