
import React, { useCallback } from 'react';
import { Stack, Text, Group, Slider, ColorInput, SimpleGrid, Box } from '@mantine/core';
import type { Theme, ThemeColors, ThemeFont } from '../types';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  themes: { [key: string]: Theme };
  fonts: ThemeFont[];
  textures: { [key: string]: { name: string; style: string } };
}

export default function SettingsView({ currentTheme, onThemeChange, themes, fonts }: SettingsViewProps) {
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
    <div className="max-w-4xl mx-auto p-6 space-y-16 pb-56 animate-fade-in relative text-[var(--color-primary-text)]">
        <header className="border-b-8 border-[var(--color-border-color)] pb-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Library Configuration</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary-text)] mt-2">Personalize your reading experience</p>
        </header>

        <section>
            <h3 className="text-[12px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] mb-8 flex items-center gap-4">
                <span className="w-8 h-1 bg-current" /> Reading Presets
            </h3>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
                {(Object.values(themes) as Theme[]).map((t: Theme) => (
                    <button 
                        key={t.id} 
                        onClick={() => onThemeChange(t)} 
                        className={`p-6 text-left transition-all border-4 ${currentTheme.id === t.id ? 'border-black bg-[var(--color-surface)] shadow-[8px_8px_0_black] -translate-y-1' : 'border-[var(--color-border-color)] opacity-60 hover:opacity-100 hover:border-black'}`} 
                        style={{ borderRadius: '0px' }}
                    >
                        <div className="w-full h-16 mb-4 border-4 border-black" style={{ backgroundColor: t.colors.background }} />
                        <Text className="text-[15px] font-black uppercase tracking-tight mb-2">{t.name}</Text>
                        <Text className="text-[11px] font-bold text-[var(--color-secondary-text)] leading-relaxed line-clamp-2">
                            {t.id === 'warm' && 'Soft tones for extended daylight reading sessions.'}
                            {t.id === 'quiet' && 'Stark, minimal layout for deep focus and study.'}
                            {t.id === 'nocturne' && 'Reduced contrast palette for nighttime comfort.'}
                        </Text>
                    </button>
                ))}
            </SimpleGrid>
        </section>

        <section className="space-y-10">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] mb-8 flex items-center gap-4">
                <span className="w-8 h-1 bg-current" /> Typography & Layout
            </h3>
            <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {fonts.map(f => (
                        <button 
                            key={f.name} 
                            onClick={() => updateTheme({font: f})} 
                            className={`p-6 border-4 text-left transition-all ${currentTheme.font.name === f.name ? 'border-black bg-[var(--color-surface)] shadow-[6px_6px_0_black] -translate-y-1' : 'border-[var(--color-border-color)] hover:border-black'}`} 
                            style={{ borderRadius: '0px' }}
                        >
                            <p className="text-[12px] font-black mb-3 uppercase tracking-tighter">{f.name}</p>
                            <p className="text-xl italic leading-tight" style={{ fontFamily: f.serif }}>Aa</p>
                        </button>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 pt-4">
                    <Stack gap="xl">
                        <Group justify="space-between">
                            <label className="text-[11px] font-black uppercase text-[var(--color-secondary-text)] tracking-widest">Text Size</label>
                            <span className="text-[11px] font-black bg-black text-white px-2 py-0.5">{Math.round(currentTheme.fontSize * 100)}%</span>
                        </Group>
                        <Slider 
                            value={currentTheme.fontSize} 
                            onChange={(v) => updateTheme({fontSize: v})} 
                            min={0.8} max={2.0} step={0.05} 
                            label={null} color="black" size="xl" radius={0}
                            styles={{ track: { border: '2px solid var(--color-border-color)' }, thumb: { borderRadius: 0, border: '2px solid black' } }}
                        />
                    </Stack>
                    <Stack gap="xl">
                        <Group justify="space-between">
                            <label className="text-[11px] font-black uppercase text-[var(--color-secondary-text)] tracking-widest">Line Spacing</label>
                            <span className="text-[11px] font-black bg-black text-white px-2 py-0.5">{currentTheme.lineHeight}</span>
                        </Group>
                        <Slider 
                            value={currentTheme.lineHeight} 
                            onChange={(v) => updateTheme({lineHeight: v})} 
                            min={1.4} max={2.8} step={0.1} 
                            label={null} color="black" size="xl" radius={0}
                            styles={{ track: { border: '2px solid var(--color-border-color)' }, thumb: { borderRadius: 0, border: '2px solid black' } }}
                        />
                    </Stack>
                </div>
            </div>
        </section>

    </div>
  );
}
