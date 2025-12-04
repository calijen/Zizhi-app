import React, { useState, useEffect } from 'react';
import type { Theme, ThemeColors, ThemeFont } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import { IconSpinner } from './icons';


interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  themes: { [key: string]: Theme };
  fonts: ThemeFont[];
  textures: { [key: string]: { name: string; style: string } };
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange, themes, fonts, textures }) => {
  const [customColors, setCustomColors] = useState<ThemeColors>(currentTheme.colors);
  const [isSecretPanelVisible, setIsSecretPanelVisible] = useState(false);
  const [recommendation, setRecommendation] = useState<{title: string; author: string; synopsis: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let index = 0;

    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === konamiCode[index]) {
        index++;
        if (index === konamiCode.length) {
          setIsSecretPanelVisible(true);
          index = 0; // Reset
        }
      } else {
        index = 0;
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);

  const handleGenerateRecommendation = async () => {
    setIsGenerating(true);
    setError(null);
    setRecommendation(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const prompt = `Generate a quirky and fictional book recommendation. The title should be bizarre. The author's name should be eccentric. The synopsis should be a single sentence that is funny and absurd. The genre should be completely made up and implied by the content.`;
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    synopsis: { type: Type.STRING },
                },
                required: ["title", "author", "synopsis"],
            }
          }
      });
      
      const result = JSON.parse(response.text);
      if (result.title && result.author && result.synopsis) {
        setRecommendation(result);
      } else {
        throw new Error("Invalid response format from API.");
      }

    } catch (e: any) {
      console.error("Failed to generate recommendation:", e);
      setError("Oops! Couldn't cook up a recommendation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };


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

  const handleTextureChange = (textureKey: string) => {
    onThemeChange({ ...currentTheme, name: 'Custom', texture: textureKey });
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
            aria-label={`Select ${label} color`}
        />
      </div>
    </div>
  );

  const SecretPanel = () => (
    <div className="p-4 sm:p-6 bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-lg space-y-4 mt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)]">🤫 TOP SECRET 🤫</h3>
      <p className="text-sm text-[var(--color-secondary-text)]">You found the secret panel! Click the button for a completely absurd book recommendation, generated just for you.</p>
      
      {isGenerating ? (
        <div className="flex items-center justify-center p-8" role="status">
            <IconSpinner className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
      ) : recommendation ? (
        <div className="p-4 bg-[rgba(var(--color-border-color-rgb),0.1)] rounded-md space-y-2">
            <h4 className="font-bold text-lg font-serif text-[var(--color-primary)]">
                {recommendation.title}
            </h4>
            <p className="text-sm font-semibold text-[var(--color-primary-text)]">
                by {recommendation.author}
            </p>
            <p className="italic text-[var(--color-secondary-text)] pt-2">
                "{recommendation.synopsis}"
            </p>
            <button 
                onClick={handleGenerateRecommendation}
                className="mt-4 w-full sm:w-auto px-4 py-2 bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)] rounded-md hover:bg-[rgba(var(--color-primary-rgb),0.2)] transition-colors text-sm font-medium"
            >
                Generate Another
            </button>
        </div>
      ) : (
        <div>
          <button 
            onClick={handleGenerateRecommendation}
            className="w-full sm:w-auto px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 transition-opacity text-sm font-semibold"
          >
            Generate Absurd Recommendation
          </button>
          {error && <p className="text-red-600 text-sm mt-2" role="alert">{error}</p>}
        </div>
      )}
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
                        backgroundImage: textures[currentTheme.texture]?.style || 'none',
                    }}
                    aria-label="Theme preview"
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
                    {(Object.values(themes) as Theme[]).map((theme) => {
                      return (
                      <button
                        key={theme.name}
                        onClick={() => handlePresetSelect(theme)}
                        className={`p-4 rounded-md border-2 transition-colors ${currentTheme.name === theme.name ? 'border-[var(--color-primary)]' : 'border-transparent hover:border-[var(--color-border-color)]'}`}
                        style={{ backgroundColor: theme.colors.background }}
                        aria-pressed={currentTheme.name === theme.name}
                        aria-label={`Select ${theme.name} theme`}
                      >
                        <div className="flex flex-col items-start gap-2">
                          <div className="flex items-center gap-1.5" aria-hidden="true">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                          </div>
                          <span className="font-semibold text-sm" style={{ color: theme.colors['primary-text'] }}>{theme.name}</span>
                        </div>
                      </button>
                    )})}
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
                            <span className="text-sm font-mono text-[var(--color-secondary-text)]" aria-hidden="true">{currentTheme.fontSize.toFixed(2)}rem</span>
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
                            aria-label="Adjust font size"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="line-height-slider-mobile" className="text-sm">Line Height</label>
                            <span className="text-sm font-mono text-[var(--color-secondary-text)]" aria-hidden="true">{currentTheme.lineHeight.toFixed(1)}</span>
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
                            aria-label="Adjust line height"
                        />
                    </div>
                    <div>
                        <label className="text-sm mb-2 block">Book Texture</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(textures).map(([key, texture]) => (
                                <button
                                    key={key}
                                    onClick={() => handleTextureChange(key)}
                                    className={`p-2 text-sm text-center rounded-md border-2 transition-colors ${currentTheme.texture === key ? 'border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.1)]' : 'border-transparent bg-[rgba(var(--color-border-color-rgb),0.1)] hover:border-[var(--color-border-color)]'}`}
                                    aria-pressed={currentTheme.texture === key}
                                    aria-label={`Select ${texture.name} texture`}
                                >
                                    {texture.name}
                                </button>
                            ))}
                        </div>
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
                {isSecretPanelVisible && <SecretPanel />}
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
                        backgroundImage: textures[currentTheme.texture]?.style || 'none',
                    }}
                    aria-label="Theme preview"
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
                    {(Object.values(themes) as Theme[]).map((theme) => {
                      return (
                      <button
                        key={theme.name}
                        onClick={() => handlePresetSelect(theme)}
                        className={`p-4 rounded-md border-2 transition-colors ${currentTheme.name === theme.name ? 'border-[var(--color-primary)]' : 'border-transparent hover:border-[var(--color-border-color)]'}`}
                        style={{ backgroundColor: theme.colors.background }}
                        aria-pressed={currentTheme.name === theme.name}
                        aria-label={`Select ${theme.name} theme`}
                      >
                        <div className="flex flex-col items-start gap-2">
                          <div className="flex items-center gap-1.5" aria-hidden="true">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                          </div>
                          <span className="font-semibold text-sm" style={{ color: theme.colors['primary-text'] }}>{theme.name}</span>
                        </div>
                      </button>
                    )})}
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
                            <span className="text-sm font-mono text-[var(--color-secondary-text)]" aria-hidden="true">{currentTheme.fontSize.toFixed(2)}rem</span>
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
                            aria-label="Adjust font size"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="line-height-slider" className="text-sm">Line Height</label>
                            <span className="text-sm font-mono text-[var(--color-secondary-text)]" aria-hidden="true">{currentTheme.lineHeight.toFixed(1)}</span>
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
                            aria-label="Adjust line height"
                        />
                    </div>
                    <div>
                        <label className="text-sm mb-2 block">Book Texture</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(textures).map(([key, texture]) => (
                                <button
                                    key={key}
                                    onClick={() => handleTextureChange(key)}
                                    className={`p-2 text-sm text-center rounded-md border-2 transition-colors ${currentTheme.texture === key ? 'border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.1)]' : 'border-transparent bg-[rgba(var(--color-border-color-rgb),0.1)] hover:border-[var(--color-border-color)]'}`}
                                    aria-pressed={currentTheme.texture === key}
                                    aria-label={`Select ${texture.name} texture`}
                                >
                                    {texture.name}
                                </button>
                            ))}
                        </div>
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
                {isSecretPanelVisible && <SecretPanel />}
            </div>
        </div>
    </div>
  );
};

export default SettingsView;