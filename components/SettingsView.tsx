import React, { useCallback } from 'react';
import { Stack, Text, Group, Slider, ColorInput } from '@mantine/core';
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
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-56 animate-fade-in relative text-[var(--color-primary-text)]">
        <header className="border-b border-[var(--color-border-color)] pb-6">
            <h2 className="text-3xl font-black uppercase tracking-tight">Settings</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-secondary-text)] mt-2 opacity-60">Customize your reading experience</p>
        </header>

        <section>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-secondary-text)] mb-6 opacity-60">Color Themes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {(Object.values(themes) as Theme[]).map((t: Theme) => (
                    <button 
                        key={t.id} 
                        onClick={() => onThemeChange(t)} 
                        className={`p-4 transition-all border ${currentTheme.id === t.id ? 'border-[var(--color-primary-text)] bg-[var(--color-surface)] shadow-md' : 'border-[var(--color-border-color)] hover:border-[var(--color-secondary-text)]'}`} 
                        style={{ borderRadius: '6px' }}
                    >
                        <div className="w-full h-8 mb-3" style={{ backgroundColor: t.colors.background, border: '1px solid rgba(0,0,0,0.1)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{t.name}</span>
                    </button>
                ))}
            </div>
        </section>

        <section className="space-y-8">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-secondary-text)] border-b border-[var(--color-border-color)] pb-2 opacity-60">Text & Fonts</h3>
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {fonts.map(f => (
                        <button 
                            key={f.name} 
                            onClick={() => updateTheme({font: f})} 
                            className={`p-5 border text-left transition-all ${currentTheme.font.name === f.name ? 'border-[var(--color-primary-text)] bg-[var(--color-surface)] shadow-sm' : 'border-[var(--color-border-color)] hover:border-[var(--color-secondary-text)]'}`} 
                            style={{ borderRadius: '6px' }}
                        >
                            <p className="text-[11px] font-bold mb-2 uppercase tracking-tight">{f.name}</p>
                            <p className="text-[13px] italic opacity-60" style={{ fontFamily: f.serif }}>The quick brown fox jumps over the lazy dog.</p>
                        </button>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-4">
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <label className="text-[11px] font-bold uppercase text-[var(--color-secondary-text)] opacity-60 tracking-widest">Text Size</label>
                            <span className="text-[11px] font-mono font-bold">{Math.round(currentTheme.fontSize * 100)}%</span>
                        </Group>
                        <Slider 
                            value={currentTheme.fontSize} 
                            onChange={(v) => updateTheme({fontSize: v})} 
                            min={0.8} max={2.0} step={0.05} 
                            label={null} color="var(--color-primary)" size="sm" radius="xl"
                        />
                    </Stack>
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <label className="text-[11px] font-bold uppercase text-[var(--color-secondary-text)] opacity-60 tracking-widest">Line Spacing</label>
                            <span className="text-[11px] font-mono font-bold">{currentTheme.lineHeight}</span>
                        </Group>
                        <Slider 
                            value={currentTheme.lineHeight} 
                            onChange={(v) => updateTheme({lineHeight: v})} 
                            min={1.4} max={2.8} step={0.1} 
                            label={null} color="var(--color-primary)" size="sm" radius="xl"
                        />
                    </Stack>
                </div>
            </div>
        </section>

        <section className="space-y-8">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-secondary-text)] border-b border-[var(--color-border-color)] pb-2 opacity-60">Custom Palette</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                    { label: 'Background', key: 'background' },
                    { label: 'Text Color', key: 'primary-text' },
                    { label: 'Accent Color', key: 'primary' }
                ].map(item => (
                    <div key={item.key} className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-secondary-text)] opacity-80">{item.label}</label>
                        <ColorInput 
                            value={currentTheme.colors[item.key as keyof ThemeColors]} 
                            onChange={(v) => updateColor(item.key as keyof ThemeColors, v)}
                            radius={4}
                            styles={{
                                input: { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-color)', color: 'var(--color-primary-text)', fontSize: '11px', fontWeight: 'bold' }
                            }}
                        />
                    </div>
                ))}
            </div>
        </section>
    </div>
  );
}