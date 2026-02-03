
import React, { useState, useMemo } from 'react';
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

  const hasChanges = useMemo(() => {
    return JSON.stringify(draftTheme) !== JSON.stringify(currentTheme);
  }, [draftTheme, currentTheme]);

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFont = fonts.find(f => f.name === e.target.value);
    if (selectedFont) setDraftTheme(prev => ({ ...prev, font: selectedFont }));
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setDraftTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  const ColorPicker: React.FC<{ label: string; colorKey: keyof ThemeColors }> = ({ label, colorKey }) => (
    <div className="flex items-center justify-between p-3 bg-black/[0.03] rounded-xl border border-[var(--color-border-color)]">
      <label className="text-sm font-bold text-[var(--color-primary-text)]">{label}</label>
      <input 
        type="color" 
        value={draftTheme.colors[colorKey]} 
        onChange={(e) => handleColorChange(colorKey, e.target.value)} 
        className="w-10 h-10 rounded-full border border-[var(--color-border-color)] cursor-pointer bg-transparent"
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col lg:flex-row gap-8 pb-32 animate-fade-in">
        {/* Left: Configuration */}
        <div className="flex-1 space-y-10">
            <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text)] mb-6 opacity-60">Theme Presets</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.values(themes).map((t: Theme) => (
                        <button
                            key={t.name}
                            onClick={() => setDraftTheme(t)}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${draftTheme.name === t.name ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm' : 'border-[var(--color-border-color)]'}`}
                        >
                            <div className="w-8 h-8 rounded-full border border-black/10" style={{ backgroundColor: t.colors.background }}></div>
                            <span className="text-xs font-bold text-[var(--color-primary-text)]">{t.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text)] mb-6 border-b border-[var(--color-border-color)] pb-2 opacity-60">Interface Colors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorPicker label="Background" colorKey="background" />
                    <ColorPicker label="Text Color" colorKey="primary-text" />
                    <ColorPicker label="Labels" colorKey="secondary-text" />
                    <ColorPicker label="Accent" colorKey="primary" />
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text)] mb-6 border-b border-[var(--color-border-color)] pb-2 opacity-60">Typography</h3>
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[var(--color-primary-text)] ml-1">Font Family</label>
                        <select 
                            value={draftTheme.font.name} 
                            onChange={handleFontChange} 
                            className="w-full bg-black/[0.04] text-[var(--color-primary-text)] border border-[var(--color-border-color)] rounded-xl py-3.5 px-4 outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-background)] transition-all font-semibold appearance-none cursor-pointer"
                        >
                            {fonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-[var(--color-primary-text)] ml-1">Font Size</label>
                            <span className="text-[10px] font-bold bg-[var(--color-primary)] text-white px-2 py-1 rounded-md tracking-widest">{draftTheme.fontSize}x</span>
                        </div>
                        <input 
                            type="range" min="0.8" max="1.5" step="0.05" value={draftTheme.fontSize} 
                            onChange={(e) => setDraftTheme(prev => ({ ...prev, fontSize: parseFloat(e.target.value) }))} 
                            className="w-full h-2 bg-[var(--color-border-color)] rounded-lg accent-[var(--color-primary)] cursor-pointer"
                        />
                    </div>
                </div>
            </section>
        </div>

        {/* Right: Sticky Preview */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-secondary-text)] opacity-60">Live Preview</h3>
                <div 
                    className="p-8 rounded-2xl border-2 shadow-2xl transition-all duration-300 min-h-[300px] flex flex-col justify-center"
                    style={{ 
                        backgroundColor: draftTheme.colors.background,
                        borderColor: draftTheme.colors['border-color'],
                        color: draftTheme.colors['primary-text'],
                        fontFamily: draftTheme.font.serif,
                        fontSize: `${draftTheme.fontSize}rem`,
                        lineHeight: draftTheme.lineHeight
                    }}
                >
                    <h4 className="text-xl font-bold mb-4" style={{ fontFamily: draftTheme.font.sans }}>The Art of Reading</h4>
                    <p>“Reading is a basic tool in the living of a good life.”</p>
                    <p className="mt-6 text-sm opacity-60" style={{ color: draftTheme.colors['secondary-text'], fontFamily: draftTheme.font.sans }}>— Mortimer J. Adler</p>
                </div>
                
                <button
                    onClick={() => onThemeChange(draftTheme)}
                    disabled={!hasChanges}
                    className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${hasChanges ? 'bg-[var(--color-primary)] text-white hover:brightness-110 active:scale-95' : 'bg-[var(--color-border-color)] text-[var(--color-secondary-text)] opacity-40 cursor-not-allowed'}`}
                >
                    Apply Theme
                </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;
