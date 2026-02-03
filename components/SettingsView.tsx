
import React, { useState, useMemo, useEffect } from 'react';
import type { Theme, ThemeColors, ThemeFont } from '../types';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  themes: { [key: string]: Theme };
  fonts: ThemeFont[];
  textures: { [key: string]: { name: string; style: string } };
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange, themes, fonts }) => {
  const [draftTheme, setDraftTheme] = useState<Theme>(currentTheme);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(draftTheme) !== JSON.stringify(currentTheme);
  }, [draftTheme, currentTheme]);

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col lg:flex-row gap-8 pb-32 animate-fade-in">
        <div className="flex-1 space-y-10">
            <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text)] mb-6 opacity-60">Theme Presets</h3>
                <div className="grid grid-cols-3 gap-4">
                    {Object.values(themes).map((t: Theme) => (
                        <button
                            key={t.name}
                            onClick={() => setDraftTheme(t)}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${draftTheme.name === t.name ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border-color)]'}`}
                        >
                            <div className="w-8 h-8 rounded-full border border-black/10" style={{ backgroundColor: t.colors.background }}></div>
                            <span className="text-[10px] font-black uppercase text-[var(--color-primary-text)]">{t.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text)] mb-6 border-b border-[var(--color-border-color)] pb-2 opacity-60">Reading Experience</h3>
                
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-[var(--color-primary-text)] ml-1">Layout Mode</label>
                    {isDesktop ? (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
                            On desktop, <strong>Continuous Scroll</strong> is automatically enabled for the best experience.
                        </div>
                    ) : (
                        <div className="flex p-1 bg-black/[0.05] rounded-xl">
                            <button 
                                onClick={() => setDraftTheme(prev => ({ ...prev, readingMode: 'scroll' }))}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${draftTheme.readingMode === 'scroll' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}
                            >
                                Continuous Scroll
                            </button>
                            <button 
                                onClick={() => setDraftTheme(prev => ({ ...prev, readingMode: 'page' }))}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${draftTheme.readingMode === 'page' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}
                            >
                                Book Page Flip
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[var(--color-primary-text)] ml-1">Text Size</label>
                        <span className="text-[10px] font-bold bg-[var(--color-primary)] text-white px-2 py-1 rounded-md">{draftTheme.fontSize}x</span>
                    </div>
                    <input 
                        type="range" min="0.8" max="1.5" step="0.05" value={draftTheme.fontSize} 
                        onChange={(e) => setDraftTheme(prev => ({ ...prev, fontSize: parseFloat(e.target.value) }))} 
                        className="w-full h-2 bg-[var(--color-border-color)] rounded-lg accent-[var(--color-primary)]"
                    />
                </div>
            </section>
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
                <div 
                    className="p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all duration-300 min-h-[300px] flex flex-col justify-center"
                    style={{ 
                        backgroundColor: draftTheme.colors.background,
                        borderColor: draftTheme.colors['border-color'],
                        color: draftTheme.colors['primary-text'],
                        fontFamily: draftTheme.font.serif,
                        fontSize: `${draftTheme.fontSize}rem`,
                        lineHeight: draftTheme.lineHeight
                    }}
                >
                    <h4 className="text-xl font-bold mb-4" style={{ fontFamily: draftTheme.font.sans }}>Reader Preview</h4>
                    <p>“Reading is a basic tool in the living of a good life.”</p>
                </div>
                
                <button
                    onClick={() => onThemeChange(draftTheme)}
                    disabled={!hasChanges}
                    className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${hasChanges ? 'bg-[var(--color-primary)] text-white hover:brightness-110 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    Save Preferences
                </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;
