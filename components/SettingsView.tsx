
import React, { useCallback } from 'react';
import type { Theme, ThemeColors, ThemeFont } from '../types';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  themes: { [key: string]: Theme };
  fonts: ThemeFont[];
  textures: { [key: string]: { name: string; style: string } };
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange, themes, fonts }) => {
  
  const updateTheme = useCallback((updates: Partial<Theme>) => {
    onThemeChange({ ...currentTheme, ...updates });
  }, [currentTheme, onThemeChange]);

  const updateColor = (key: keyof ThemeColors, value: string) => {
    onThemeChange({ 
      ...currentTheme, 
      id: 'custom', 
      colors: { ...currentTheme.colors, [key]: value } 
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-56 animate-fade-in relative text-[var(--color-primary-text)]">
        <header>
            <h2 className="text-3xl font-black theme-serif text-[var(--color-primary-text)]">Interface Config</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-text)] opacity-90 mt-1">Real-time adjustments to your reading environment</p>
        </header>

        <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] mb-6">Presets</h3>
            <div className="grid grid-cols-3 gap-4">
                {(Object.values(themes) as Theme[]).map((t: Theme) => (
                    <button key={t.id} onClick={() => onThemeChange(t)} className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${currentTheme.id === t.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border-color)] hover:border-[var(--color-primary)]/30'}`}>
                        <div className="w-8 h-8 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: t.colors.background }} />
                        <span className="text-[10px] font-black uppercase text-[var(--color-primary-text)]">{t.name}</span>
                    </button>
                ))}
            </div>
        </section>

        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] border-b border-[var(--color-border-color)] pb-2">Interaction Mode</h3>
            <div className="flex bg-[var(--color-surface)] p-1 rounded-2xl border border-[var(--color-border-color)] w-fit">
                <button 
                    onClick={() => updateTheme({readingMode: 'scroll'})}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTheme.readingMode === 'scroll' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-secondary-text)] opacity-60'}`}
                >
                    Vertical
                </button>
                <button 
                    onClick={() => updateTheme({readingMode: 'page'})}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTheme.readingMode === 'page' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-secondary-text)] opacity-60'}`}
                >
                    Book Flip
                </button>
            </div>
        </section>

        <section className="space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] border-b border-[var(--color-border-color)] pb-2">Typography</h3>
            <div className="space-y-6">
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] ml-1">Type Pair</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {fonts.map(f => (
                            <button key={f.name} onClick={() => updateTheme({font: f})} className={`p-4 rounded-2xl border-2 text-left transition-all ${currentTheme.font.name === f.name ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border-color)] hover:border-[var(--color-primary)]/30'}`}>
                                <p className="text-xs font-black mb-1 text-[var(--color-primary-text)]">{f.name}</p>
                                <p className="text-[10px] text-[var(--color-secondary-text)] italic opacity-70">The quick brown fox...</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-[var(--color-secondary-text)] tracking-widest">Master Size</label>
                            <span className="text-[10px] font-black tabular-nums text-[var(--color-primary-text)]">{Math.round(currentTheme.fontSize * 100)}%</span>
                        </div>
                        <input type="range" min="0.8" max="2.0" step="0.05" value={currentTheme.fontSize} onChange={(e) => updateTheme({fontSize: parseFloat(e.target.value)})} className="w-full h-1.5 bg-[var(--color-border-color)] rounded-lg accent-[var(--color-primary)] cursor-pointer" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-[var(--color-secondary-text)] tracking-widest">Spacing</label>
                            <span className="text-[10px] font-black tabular-nums text-[var(--color-primary-text)]">{currentTheme.lineHeight}</span>
                        </div>
                        <input type="range" min="1.4" max="2.6" step="0.05" value={currentTheme.lineHeight} onChange={(e) => updateTheme({lineHeight: parseFloat(e.target.value)})} className="w-full h-1.5 bg-[var(--color-border-color)] rounded-lg accent-[var(--color-primary)] cursor-pointer" />
                    </div>
                </div>
            </div>
        </section>

        <section className="space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] border-b border-[var(--color-border-color)] pb-2">Palette Tuning</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                    { label: 'Surface', key: 'background' },
                    { label: 'Highlight', key: 'primary' },
                    { label: 'Content', key: 'primary-text' },
                    { label: 'Accents', key: 'border-color' }
                ].map(item => (
                    <div key={item.key} className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-secondary-text)] ml-1">{item.label}</label>
                        <div className="relative h-12 w-full rounded-2xl border border-[var(--color-border-color)] overflow-hidden bg-[var(--color-surface)] shadow-inner">
                            <input 
                                type="color" 
                                value={currentTheme.colors[item.key as keyof ThemeColors]} 
                                onChange={(e) => updateColor(item.key as keyof ThemeColors, e.target.value)}
                                className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-0"
                            />
                            <div className="absolute inset-0 flex items-center gap-3 px-3 pointer-events-none">
                                <div className="w-6 h-6 rounded-lg border border-black/10 shadow-sm" style={{ backgroundColor: currentTheme.colors[item.key as keyof ThemeColors] }} />
                                <span className="text-[10px] font-bold uppercase text-[var(--color-primary-text)]">{currentTheme.colors[item.key as keyof ThemeColors]}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    </div>
  );
};
export default SettingsView;
