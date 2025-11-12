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
    // When selecting a preset, also adopt its font size and line height
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
  
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onThemeChange({ ...currentTheme, name: 'Custom', fontSize: parseFloat(e.target.value) });
  };

  const handleLineHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onThemeChange({ ...currentTheme, name: 'Custom', lineHeight: parseFloat(e.target.value) });
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl font-bold font-sans text-[var(--color-primary-text)] mb-8">Appearance</h2>
        
        {/* Mobile Layout: Sticky Preview, Content Below */}
        <div className="md:hidden">
            <div className="sticky top-4 z-10">
                 <div 
                    className="p-6 rounded-lg border transition-colors duration-300 shadow-lg"
                    style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors['border-color'],
                    }}
                >
                    <h4 
                        className="text-lg font-bold mb-2 transition-colors duration-300"
                        style={{
                        fontFamily: `'${currentTheme.font.sans}', sans-serif`,
                        color: currentTheme.colors.primary,
                        }}
                    >
                        A Preview of Your Theme
                    </h4>
                    <p 
                        className="mb-4 transition-all duration-100"
                        style={{
                        fontFamily: `'${currentTheme.font.serif}', serif`,
                        color: currentTheme.colors['primary-text'],
                        fontSize: `${currentTheme.fontSize}rem`,
                        lineHeight: currentTheme.lineHeight,
                        }}
                    >
                        This is how your text will appear in the reader. You can adjust the font style, size, and line height below to create the most comfortable reading experience for you. The colors can also be customized.
                    </p>
                    <button
                        className="px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-300"
                        style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.background,
                        fontFamily: `'${currentTheme.font.sans}', sans-serif`,
                        }}
                    >
                        Example Button
                    </button>
                </div>
            </div>
            <div className="space-y-6 mt-8">
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

                <div className="p-4 sm:p-6 bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-lg space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)]">Reading Experience</h3>
                    <div>
                      <label htmlFor="font-select-mobile" className="text-sm mb-2 block">Font Style</label>
                      <select
                        id="font-select-mobile"
                        value={currentTheme.font.name}
                        onChange={handleFontChange}
                        className="w-full p-2 rounded-md border border-[var(--color-border-color)] bg-[var(--color-background)]"
                      >
                        {fonts.map(font => (
                          <option key={font.name} value={font.name}>{font.name} ({font.serif} & {font.sans})</option>
                        ))}
                      </select>
                    </div>
                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="font-size-slider-mobile" className="text-sm">Font Size</label>
                            <span className="text-sm font-mono text-[var(--color-secondary-text)]">{currentTheme.fontSize.toFixed(2)}rem</span>
                        </div>
                        <input
                            id="font-size-slider-mobile"
                            type="range"
                            min="0.8"
                            max="1.5"
                            step="0.05"
                            value={currentTheme.fontSize}
                            onChange={handleFontSizeChange}
                            className="w-full h-2 bg-[rgba(var(--color-border-color-rgb),0.3)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="line-height-slider-mobile" className="text-sm">Line Height</label>
                            <span className="text-sm font-mono text-[var(--color-secondary-text)]">{currentTheme.lineHeight.toFixed(1)}</span>
                        </div>
                        <input
                            id="line-height-slider-mobile"
                            type="range"
                            min="1.4"
                            max="2.2"
                            step="0.1"
                            value={currentTheme.lineHeight}
                            onChange={handleLineHeightChange}
                            className="w-full h-2 bg-[rgba(var(--color-border-color-rgb),0.3)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
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
        
        {/* Desktop Layout: 2-column grid */}
        <div className="hidden md:grid grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="sticky top-4 sm:top-6 lg:top-8">
                <div 
                    className="p-6 rounded-lg border transition-colors duration-300"
                    style={{
                        backgroundColor: currentTheme.colors.background,
                        borderColor: currentTheme.colors['border-color'],
                    }}
                >
                    <h4 
                        className="text-lg font-bold mb-2 transition-colors duration-300"
                        style={{
                        fontFamily: `'${currentTheme.font.sans}', sans-serif`,
                        color: currentTheme.colors.primary,
                        }}
                    >
                        A Preview of Your Theme
                    </h4>
                    <p 
                        className="mb-4 transition-all duration-100"
                        style={{
                        fontFamily: `'${currentTheme.font.serif}', serif`,
                        color: currentTheme.colors['primary-text'],
                        fontSize: `${currentTheme.fontSize}rem`,
                        lineHeight: currentTheme.lineHeight,
                        }}
                    >
                        This is how your text will appear in the reader. You can adjust the font style, size, and line height below to create the most comfortable reading experience for you. The colors can also be customized.
                    </p>
                    <button
                        className="px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-300"
                        style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: currentTheme.colors.background,
                        fontFamily: `'${currentTheme.font.sans}', sans-serif`,
                        }}
                    >
                        Example Button
                    </button>
                </div>
            </div>
            
            <div className="space-y-6">
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

                <div className="p-4 sm:p-6 bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-lg space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)]">Reading Experience</h3>
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
                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="font-size-slider" className="text-sm">Font Size</label>
                            <span className="text-sm font-mono text-[var(--color-secondary-text)]">{currentTheme.fontSize.toFixed(2)}rem</span>
                        </div>
                        <input
                            id="font-size-slider"
                            type="range"
                            min="0.8"
                            max="1.5"
                            step="0.05"
                            value={currentTheme.fontSize}
                            onChange={handleFontSizeChange}
                            className="w-full h-2 bg-[rgba(var(--color-border-color-rgb),0.3)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="line-height-slider" className="text-sm">Line Height</label>
                            <span className="text-sm font-mono text-[var(--color-secondary-text)]">{currentTheme.lineHeight.toFixed(1)}</span>
                        </div>
                        <input
                            id="line-height-slider"
                            type="range"
                            min="1.4"
                            max="2.2"
                            step="0.1"
                            value={currentTheme.lineHeight}
                            onChange={handleLineHeightChange}
                            className="w-full h-2 bg-[rgba(var(--color-border-color-rgb),0.3)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
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
    </div>
  );
};

export default SettingsView;