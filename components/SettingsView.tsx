import React, { useState } from 'react';
import type { Theme, ThemeColors, ThemeFont } from '../types';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  themes: { [key: string]: Theme };
  fonts: ThemeFont[];
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange, themes, fonts }) => {
  const [customColors, setCustomColors] = useState<ThemeColors>(currentTheme.colors);

  const handlePresetSelect = (theme: Theme) => {
    onThemeChange(theme);
    setCustomColors(theme.colors);
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFont = fonts.find(f => f.name === e.target.value);
    if (selectedFont) {
      onThemeChange({ ...currentTheme, name: 'Custom', font: selectedFont });
    }
  };

  const handleColorChange = (colorName: keyof ThemeColors, value: string) => {
    const newColors = { ...customColors, [colorName]: value };
    setCustomColors(newColors);
    onThemeChange({ ...currentTheme, name: 'Custom', colors: newColors });
  };
  
  const ColorInput: React.FC<{ label: string; colorKey: keyof ThemeColors; }> = ({ label, colorKey }) => (
    <div className="flex items-center justify-between">
      <label htmlFor={colorKey} className="text-sm">{label}</label>
      <div className="relative w-24 h-8 rounded-md border border-[var(--color-border-color)] overflow-hidden">
        <input
            type="color"
            id={colorKey}
            value={customColors[colorKey]}
            onChange={(e) => handleColorChange(colorKey, e.target.value)}
            className="absolute -top-2 -left-2 w-32 h-12 cursor-pointer border-0"
            title={`Select ${label} color`}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-sans text-[var(--color-primary-text)]">Appearance</h2>
        
        <div className="p-4 sm:p-6 bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-lg space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)]">Preset Themes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.values(themes).map(theme => (
              <button
                key={theme.name}
                onClick={() => handlePresetSelect(theme)}
                className={`p-4 rounded-md border-2 transition-colors ${currentTheme.name === theme.name ? 'border-[var(--color-primary)]' : 'border-transparent hover:border-[var(--color-border-color)]'}`}
                style={{ backgroundColor: theme.colors.background }}
              >
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                  </div>
                  <span className="font-semibold text-sm" style={{ color: theme.colors['primary-text'] }}>{theme.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-lg space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)]">Typography</h3>
            <div>
              <label htmlFor="font-select" className="text-sm mb-2 block">Font Style</label>
              <select
                id="font-select"
                value={currentTheme.font.name}
                onChange={handleFontChange}
                className="w-full p-2 rounded-md border border-[var(--color-border-color)] bg-[var(--color-background)]"
              >
                {fonts.map(font => (
                  <option key={font.name} value={font.name}>{font.name} ({font.serif} & {font.sans})</option>
                ))}
              </select>
            </div>
        </div>

        <div className="p-4 sm:p-6 bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-lg space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)]">Custom Colors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorInput label="Primary Accent" colorKey="primary" />
            <ColorInput label="Secondary Accent" colorKey="secondary" />
            <ColorInput label="Background" colorKey="background" />
            <ColorInput label="Primary Text" colorKey="primary-text" />
            <ColorInput label="Secondary Text" colorKey="secondary-text" />
            <ColorInput label="Borders" colorKey="border-color" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;