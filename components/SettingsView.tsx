
import React, { useState, useEffect, useMemo } from 'react';
import type { Theme, ThemeColors, ThemeFont } from '../types';
import { IconSpinner } from './icons';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  themes: { [key: string]: Theme };
  fonts: ThemeFont[];
  textures: { [key: string]: { name: string; style: string } };
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange, themes, fonts }) => {
  const [draftTheme, setDraftTheme] = useState<Theme>(currentTheme);

  // Use JSON stringify for deep equality check to enable/disable Save button
  const hasChanges = useMemo(() => {
      return JSON.stringify(draftTheme) !== JSON.stringify(currentTheme);
  }, [draftTheme, currentTheme]);

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFont = fonts.find(f => f.name === e.target.value);
    if (selectedFont) {
      setDraftTheme(prev => ({ ...prev, font: selectedFont }));
    }
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setDraftTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftTheme(prev => ({ ...prev, fontSize: parseFloat(e.target.value) }));
  };

  const ColorPicker: React.FC<{ label: string; colorKey: keyof ThemeColors }> = ({ label, colorKey }) => (
    <div className="flex items-center justify-between group">
      <label className="text-sm font-medium text-[var(--color-primary-text)] group-hover:text-[var(--color-primary)] transition-colors">{label}</label>
      <div className="relative w-12 h-12 rounded-full border border-[var(--color-border-color)] overflow-hidden cursor-pointer shadow-sm hover:ring-2 hover:ring-[var(--color-primary)] transition-all">
          <input 
            type="color" 
            value={draftTheme.colors[colorKey]} 
            onChange={(e) => handleColorChange(colorKey, e.target.value)} 
            className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer border-none p-0"
          />
      </div>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 pb-32">
        {/* Configuration Column */}
        <div className="flex-1 space-y-12">
            <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-text)] mb-6">Appearance Presets</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Fix: Added explicit type annotation (t: Theme) to avoid TypeScript unknown errors */}
                    {Object.values(themes).map((t: Theme) => (
                        <button
                            key={t.name}
                            onClick={() => setDraftTheme(t)}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${draftTheme.name === t.name ? 'border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.05)] shadow-md' : 'border-[var(--color-border-color)] bg-[var(--color-background)] hover:border-[var(--color-primary)]'}`}
                        >
                            <div className="w-10 h-10 rounded-full border border-[var(--color-border-color)]" style={{ backgroundColor: t.colors.background }}></div>
                            <span className="text-xs font-bold uppercase tracking-tighter">{t.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-text)] mb-6 border-b border-[var(--color-border-color)] pb-2">Custom Palette</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    <ColorPicker label="Background Canvas" colorKey="background" />
                    <ColorPicker label="Primary Text Color" colorKey="primary-text" />
                    <ColorPicker label="Secondary Text Details" colorKey="secondary-text" />
                    <ColorPicker label="Accent Action Color" colorKey="primary" />
                </div>
            </section>

            <section className="space-y-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-text)] mb-6 border-b border-[var(--color-border-color)] pb-2">Typography</h3>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--color-secondary-text)]">Font Family</label>
                        <select 
                            value={draftTheme.font.name} 
                            onChange={handleFontChange} 
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                        >
                            {fonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-[var(--color-secondary-text)]">Font Size</label>
                            <span className="text-xs font-bold px-2 py-1 bg-[var(--color-primary)] text-white rounded-md">{draftTheme.fontSize}x</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.8" 
                            max="1.5" 
                            step="0.05" 
                            value={draftTheme.fontSize} 
                            onChange={handleFontSizeChange} 
                            className="w-full h-2 bg-[var(--color-border-color)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
                    </div>
                </div>
            </section>
        </div>

        {/* Sticky Preview Column */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-text)] mb-4">Live Preview</h3>
                <div 
                    className="p-8 rounded-2xl border-4 shadow-2xl transition-all duration-300"
                    style={{ 
                        backgroundColor: draftTheme.colors.background,
                        borderColor: draftTheme.colors['border-color'],
                        color: draftTheme.colors['primary-text'],
                        fontFamily: draftTheme.font.serif
                    }}
                >
                    <h4 className="text-lg font-bold mb-4" style={{ fontFamily: draftTheme.font.sans }}>The Reader's Journey</h4>
                    <p style={{ fontSize: `${draftTheme.fontSize}rem`, lineHeight: draftTheme.lineHeight }}>
                        “A reader lives a thousand lives before he dies,” said Jojen. “The man who never reads lives only one.”
                    </p>
                    <div className="mt-8 pt-6 border-t border-dashed opacity-50" style={{ borderColor: draftTheme.colors['secondary-text'] }}>
                        <p className="text-xs italic" style={{ color: draftTheme.colors['secondary-text'] }}>Sample metadata and details</p>
                    </div>
                </div>
                
                <p className="text-center text-[10px] text-[var(--color-secondary-text)] italic px-4">
                    Preview changes in real-time. Hit "Save Preferences" to apply globally.
                </p>

                {/* Mobile/Accessible Floating Save Button */}
                <div className="pt-6">
                    <button
                        onClick={() => onThemeChange(draftTheme)}
                        disabled={!hasChanges}
                        className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${hasChanges ? 'bg-[var(--color-primary)] text-white scale-100' : 'bg-[var(--color-border-color)] text-[var(--color-secondary-text)] scale-95 opacity-50 cursor-not-allowed'}`}
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;
