
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
                        <Text className="text-[11px] font-bold text-[var(--color-secondary-text)] leading-relaxed">
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

        <section className="space-y-10">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] mb-8 flex items-center gap-4">
                <span className="w-8 h-1 bg-current" /> Advanced Color Palette
            </h3>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                {[
                    { label: 'Primary Background', key: 'background' },
                    { label: 'Interface Surface', key: 'surface' },
                    { label: 'Reading Text', key: 'primary-text' },
                    { label: 'Secondary Label', key: 'secondary-text' },
                    { label: 'Muted Instruction', key: 'muted-text' },
                    { label: 'Global Border', key: 'border-color' },
                    { label: 'Accent Highlight', key: 'primary' }
                ].map(item => (
                    <div key={item.key} className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-secondary-text)] ml-1">{item.label}</label>
                        <ColorInput 
                            value={currentTheme.colors[item.key as keyof ThemeColors]} 
                            onChange={(v) => updateColor(item.key as keyof ThemeColors, v)}
                            radius={0}
                            styles={{
                                input: { 
                                    backgroundColor: 'var(--color-surface)', 
                                    border: '4px solid var(--color-border-color)', 
                                    color: 'var(--color-primary-text)', 
                                    fontSize: '11px', 
                                    fontWeight: '900', 
                                    height: '56px',
                                    borderRadius: 0,
                                    cursor: 'pointer'
                                }
                            }}
                        />
                    </div>
                ))}
            </SimpleGrid>
        </section>

        <Box className="p-12 border-8 border-black bg-cyan-400 shadow-[16px_16px_0_black] relative overflow-hidden">
            <div className="absolute top-4 left-4 text-[8px] font-black uppercase opacity-40">Live Design Preview</div>
            <div className="space-y-6">
                <h4 className="text-4xl font-black uppercase text-black leading-none" style={{ fontFamily: currentTheme.font.serif }}>Title Preview</h4>
                <p className="text-lg leading-relaxed text-black/80 font-serif" style={{ fontSize: `${currentTheme.fontSize}rem`, lineHeight: currentTheme.lineHeight }}>
                    The journey through pages is a journey through yourself. Observe how the contrast between primary and secondary elements shifts with your selection.
                </p>
                <div className="pt-6 flex gap-6">
                    <Box className="bg-black text-white px-6 py-3 font-black uppercase text-[11px] tracking-widest shadow-[4px_4px_0_white]">Primary</Box>
                    <Box className="border-4 border-black px-6 py-3 font-black uppercase text-[11px] tracking-widest text-black">Secondary</Box>
                </div>
            </div>
        </Box>
    </div>
  );
}
