
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
      const apiKey = (import.meta as any).env?.VITE_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : undefined);
      if (!apiKey) throw new Error("API Key not found. Please set VITE_API_KEY or API_KEY.");
      const ai = new GoogleGenAI({ apiKey });
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

  const PreviewCard = () => (
      <div className="bg-[var(--color-background)] p-6 rounded-lg border border-[var(--color-border-color)] shadow-sm prose mb-8">
        <h3 className="mt-0 font-serif text-[var(--color-primary-text)]">Preview</h3>
        <p className="font-serif text-[var(--color-primary-text)] leading-relaxed">
          The quick brown fox jumps over the lazy dog. Zizhi offers a clean, distraction-free environment for your reading pleasure.
          This is how your books will look with the current settings.
        </p>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl font-bold font-sans text-[var(--color-primary-text)] mb-8">Appearance</h2>
        
        {/* Mobile Layout: Sticky Preview, Content Below */}
        <div className="md:hidden">
            <div className="sticky top-0 z-20 bg-[var(--color-background)] pb-4 pt-2 border-b border-[var(--color-border-color)] mb-6">
                <PreviewCard />
            </div>
        </div>

        {/* Desktop Layout: Side-by-side */}
        <div className="flex flex-col md:flex-row gap-8">
            {/* Settings Column */}
            <div className="flex-1 space-y-10">
                
                {/* Themes */}
                <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)] mb-4">Theme</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(Object.keys(themes) as string[]).map((key) => {
                            const theme = themes[key] as Theme;
                            return (
                                <button
                                    key={theme.name}
                                    onClick={() => handlePresetSelect(theme)}
                                    className={`p-4 rounded-lg border text-center transition-all ${currentTheme.name === theme.name ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-opacity-50' : 'border-[var(--color-border-color)] hover:border-[var(--color-secondary-text)]'}`}
                                    style={{ backgroundColor: theme.colors.background, color: theme.colors['primary-text'] }}
                                    aria-pressed={currentTheme.name === theme.name}
                                >
                                    <span className="text-sm font-medium">{theme.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Typography */}
                <section className="space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)] mb-4">Typography</h3>
                    
                    <div className="space-y-2">
                         <label htmlFor="font-family" className="text-sm font-medium block">Typeface</label>
                         <div className="relative">
                             <select
                                id="font-family"
                                value={currentTheme.font.name}
                                onChange={handleFontChange}
                                className="w-full appearance-none bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-md py-2 pl-3 pr-10 text-[var(--color-primary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                             >
                                {fonts.map(font => (
                                    <option key={font.name} value={font.name}>{font.name}</option>
                                ))}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--color-secondary-text)]">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                             </div>
                         </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label htmlFor="font-size" className="text-sm font-medium">Size</label>
                            <span className="text-xs text-[var(--color-secondary-text)]">{currentTheme.fontSize}rem</span>
                        </div>
                        <input
                            type="range"
                            id="font-size"
                            min="0.8"
                            max="1.5"
                            step="0.05"
                            value={currentTheme.fontSize}
                            onChange={handleFontSizeChange}
                            className="w-full h-1.5 bg-[rgba(var(--color-border-color-rgb),0.5)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label htmlFor="line-height" className="text-sm font-medium">Line Height</label>
                            <span className="text-xs text-[var(--color-secondary-text)]">{currentTheme.lineHeight}</span>
                        </div>
                         <input
                            type="range"
                            id="line-height"
                            min="1.2"
                            max="2.2"
                            step="0.1"
                            value={currentTheme.lineHeight}
                            onChange={handleLineHeightChange}
                            className="w-full h-1.5 bg-[rgba(var(--color-border-color-rgb),0.5)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
                    </div>
                </section>

                {/* Texture */}
                <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)] mb-4">Texture</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(textures).map(([key, texture]) => (
                            <button
                                key={key}
                                onClick={() => handleTextureChange(key)}
                                className={`px-4 py-2 rounded-full border text-sm transition-all ${currentTheme.texture === key ? 'bg-[var(--color-primary)] text-white border-transparent' : 'border-[var(--color-border-color)] hover:border-[var(--color-secondary-text)]'}`}
                                aria-pressed={currentTheme.texture === key}
                            >
                                {texture.name}
                            </button>
                        ))}
                    </div>
                </section>
                
                {/* Advanced Colors */}
                <section>
                     <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary-text)] mb-4">Color Palette</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[rgba(var(--color-border-color-rgb),0.1)] p-4 rounded-lg">
                        <ColorInput label="Background" colorKey="background" />
                        <ColorInput label="Primary Text" colorKey="primary-text" />
                        <ColorInput label="Secondary Text" colorKey="secondary-text" />
                        <ColorInput label="Accent" colorKey="primary" />
                     </div>
                </section>

                {isSecretPanelVisible && <SecretPanel />}
            </div>

            {/* Desktop Preview Column */}
            <div className="hidden md:block w-1/3 min-w-[300px]">
                <div className="sticky top-6">
                    <PreviewCard />
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsView;
