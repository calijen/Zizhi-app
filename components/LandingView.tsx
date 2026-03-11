
import React from 'react';
import { Box, Stack, Text, SimpleGrid, Container } from '@mantine/core';
import { Logo, IconLibrary, IconQuote, IconPlay, IconCloud } from './icons';

interface LandingViewProps {
  onEnter: () => void;
}

// --- NEW THEMATIC ROBOT SVGS ---

const SummaryRobot = () => (
    <svg viewBox="0 0 512 512" className="w-24 h-24 mb-6">
      <circle cx="256" cy="280" r="100" fill="#4facfe" stroke="black" strokeWidth="4"/>
      <path d="M156 280 Q156 160 256 160 Q356 160 356 280" fill="none" stroke="black" strokeWidth="12" />
      <rect x="136" y="260" width="30" height="50" rx="10" fill="black" />
      <rect x="346" y="260" width="30" height="50" rx="10" fill="black" />
      <path d="M236 260 Q256 275 276 260" stroke="white" strokeWidth="4" fill="none" />
      <circle cx="230" cy="240" r="5" fill="white" />
      <circle cx="282" cy="240" r="5" fill="white" />
    </svg>
);

const ArtistRobot = () => (
    <svg viewBox="0 0 512 512" className="w-24 h-24 mb-6">
      <rect x="156" y="180" width="200" height="180" rx="20" fill="#ff416c" stroke="black" strokeWidth="4" />
      <path d="M356 220 L420 160" stroke="black" strokeWidth="10" strokeLinecap="round" />
      <path d="M420 160 L440 140" stroke="#ffeb3b" strokeWidth="12" strokeLinecap="round" />
      <circle cx="206" cy="240" r="15" fill="white" />
      <circle cx="306" cy="240" r="15" fill="white" />
      <rect x="186" y="280" width="140" height="40" fill="#ffffff" opacity="0.3" />
      <circle cx="186" cy="280" r="8" fill="#00d1ff" />
      <circle cx="256" cy="280" r="8" fill="#ffeb3b" />
      <circle cx="326" cy="280" r="8" fill="#ff416c" />
    </svg>
);

const HeartRobot = () => (
    <svg viewBox="0 0 512 512" className="w-24 h-24 mb-6">
      <rect x="176" y="200" width="160" height="160" rx="80" fill="#ffeb3b" stroke="black" strokeWidth="4" />
      <path d="M256 240 Q256 220 276 220 Q296 220 296 240 Q296 270 256 300 Q216 270 216 240 Q216 220 236 220 Q256 220 256 240" fill="#ff416c" stroke="black" strokeWidth="2" />
      <circle cx="226" cy="240" r="4" fill="black" />
      <circle cx="286" cy="240" r="4" fill="black" />
      <rect x="236" y="310" width="40" height="10" rx="5" fill="black" opacity="0.2" />
    </svg>
);

const SafeRobot = () => (
    <svg viewBox="0 0 512 512" className="w-24 h-24 mb-6">
      <rect x="156" y="180" width="200" height="200" rx="10" fill="#2d3436" stroke="black" strokeWidth="4" />
      <circle cx="256" cy="280" r="40" fill="#dfe6e9" stroke="black" strokeWidth="4" />
      <path d="M256 240 V320 M216 280 H296" stroke="black" strokeWidth="4" />
      <circle cx="226" cy="210" r="10" fill="#00d1ff" />
      <circle cx="286" cy="210" r="10" fill="#00d1ff" />
    </svg>
);

const TravelerRobot = () => (
    <svg viewBox="0 0 512 512" className="w-24 h-24 mb-6">
      <rect x="176" y="180" width="160" height="220" rx="30" fill="#f39c12" stroke="black" strokeWidth="4" />
      <rect x="156" y="200" width="20" height="180" rx="10" fill="#d35400" stroke="black" strokeWidth="2" />
      <rect x="336" y="200" width="20" height="180" rx="10" fill="#d35400" stroke="black" strokeWidth="2" />
      <path d="M256 180 V140" stroke="black" strokeWidth="4" />
      <path d="M226 140 H286" stroke="black" strokeWidth="4" />
      <circle cx="226" cy="250" r="15" fill="black" />
      <circle cx="286" cy="250" r="15" fill="black" />
    </svg>
);

const RacingRobot = () => (
    <svg viewBox="0 0 512 512" className="w-24 h-24 mb-6">
      <path d="M156 380 L256 180 L356 380 Z" fill="#e74c3c" stroke="black" strokeWidth="4" />
      <path d="M356 180 L420 180" stroke="black" strokeWidth="6" />
      <rect x="420" y="160" width="40" height="30" fill="white" stroke="black" strokeWidth="2" />
      <rect x="420" y="160" width="20" height="15" fill="black" />
      <rect x="440" y="175" width="20" height="15" fill="black" />
      <circle cx="240" cy="280" r="10" fill="white" />
      <circle cx="272" cy="280" r="10" fill="white" />
    </svg>
);

const HeroRobot = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-64 h-64 md:w-80 md:h-80 drop-shadow-[10px_10px_0_black]">
      <defs>
        <linearGradient id="metalBodyHero" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#63cdda" stopOpacity={1} />
          <stop offset="100%" stopColor="#3dc1d3" stopOpacity={1} />
        </linearGradient>
        <radialGradient id="eyeGlowHero" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffeaa7" stopOpacity={1} />
          <stop offset="80%" stopColor="#fdcb6e" stopOpacity={1} />
          <stop offset="100%" stopColor="#e17055" stopOpacity={1} />
        </radialGradient>
      </defs>
      <g transform="translate(0, 20)">
        <path d="M200,380 Q180,420 160,420" stroke="#2d3436" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <path d="M312,380 Q332,420 352,420" stroke="#2d3436" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <ellipse cx="160" cy="425" rx="25" ry="15" fill="#2d3436" />
        <ellipse cx="352" cy="425" rx="25" ry="15" fill="#2d3436" />
        <rect x="186" y="280" width="140" height="120" rx="20" fill="url(#metalBodyHero)" stroke="black" strokeWidth="2" />
        <rect x="176" y="150" width="160" height="110" rx="25" fill="url(#metalBodyHero)" stroke="black" strokeWidth="2" />
        <path d="M256,150 L256,110" stroke="#2d3436" strokeWidth="4" />
        <circle cx="256" cy="110" r="8" fill="#e17055" />
        <g>
          <circle cx="226" cy="200" r="30" fill="#2d3436" />
          <circle cx="226" cy="200" r="24" fill="url(#eyeGlowHero)" />
          <circle cx="296" cy="200" r="22" fill="#2d3436" />
          <circle cx="296" cy="200" r="16" fill="url(#eyeGlowHero)" />
        </g>
        <path d="M186,300 Q140,320 160,360" stroke="#2d3436" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <path d="M326,300 Q372,320 352,360" stroke="#2d3436" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <g transform="translate(160, 340)">
          <path d="M0,20 L192,20 L192,50 L0,50 Z" fill="#c0392b" stroke="black" strokeWidth="2" />
          <path d="M5,15 L187,15 L187,48 L5,45 Z" fill="#ffffff" stroke="black" strokeWidth="1" />
          <line x1="96" y1="15" x2="96" y2="55" stroke="#dfe6e9" strokeWidth="2" />
        </g>
      </g>
    </svg>
);

const LandingView: React.FC<LandingViewProps> = ({ onEnter }) => {
  return (
    <Box className="h-screen overflow-y-auto bg-[#fdf6e3] text-black selection:bg-cyan-300 no-scrollbar">
      {/* Top Bar */}
      <nav className="h-20 border-b-4 border-black px-8 flex items-center justify-between sticky top-0 bg-[#fdf6e3] z-[500]">
        <Logo className="h-6 w-auto" />
        <button 
          onClick={onEnter}
          className="bg-black text-white px-6 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-cyan-500 hover:text-black transition-all border-2 border-black"
        >
          Open Reader
        </button>
      </nav>

      <main>
        {/* Main Section */}
        <section className="py-20 md:py-32 border-b-4 border-black overflow-hidden">
          <Container size="lg">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <Stack gap="xl" className="flex-1">
                <Box className="bg-pink-500 border-4 border-black inline-block px-4 py-1 shadow-[4px_4px_0_black]">
                  <Text className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Easy Reading</Text>
                </Box>
                <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.85] tracking-tighter italic">
                  Read your <br />
                  <span className="text-cyan-500">books</span> simply.
                </h1>
                <p className="text-xl font-serif italic text-black/70 leading-relaxed max-w-xl">
                  A beautiful way to read your e-books. No clutter, no distractions. Just you and the words.
                </p>
                <div className="pt-8">
                  <button 
                    onClick={onEnter}
                    className="px-12 py-6 bg-yellow-400 border-4 border-black shadow-[10px_10px_0_black] hover:translate-y-1 hover:shadow-none transition-all text-xl font-black uppercase tracking-widest"
                  >
                    Start Reading
                  </button>
                </div>
              </Stack>
              <Box className="shrink-0 relative hidden md:block">
                <HeroRobot />
                <Box className="absolute -bottom-4 -right-4 p-6 bg-white border-4 border-black shadow-[8px_8px_0_black] animate-bounce">
                   <Text className="text-[10px] font-black uppercase">Start Your Archive</Text>
                </Box>
              </Box>
            </div>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white border-b-4 border-black">
          <Container size="lg">
            <header className="mb-20 text-center">
              <h2 className="text-4xl font-black uppercase italic tracking-tight">What it does</h2>
              <div className="h-2 w-32 bg-pink-500 mx-auto mt-4 border-2 border-black" />
            </header>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={40}>
              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#00d1ff] bg-white hover:-translate-y-1 transition-transform flex flex-col items-center text-center">
                <SummaryRobot />
                <h3 className="text-2xl font-black uppercase mb-4">AI Summaries</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/50 leading-relaxed">
                  Too busy to finish? Listen to short audio insights created just for you.
                </p>
              </Box>

              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#ff416c] bg-white hover:-translate-y-1 transition-transform flex flex-col items-center text-center">
                <ArtistRobot />
                <h3 className="text-2xl font-black uppercase mb-4">Paper Themes</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/50 leading-relaxed">
                  Fonts and colors that look like real books. Perfect for long reading sessions.
                </p>
              </Box>

              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#ffeb3b] bg-white hover:-translate-y-1 transition-transform flex flex-col items-center text-center">
                <HeartRobot />
                <h3 className="text-2xl font-black uppercase mb-4">Smart Saves</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/50 leading-relaxed">
                  Highlight favorite parts and save them to your private gallery forever.
                </p>
              </Box>

              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#2d3436] bg-white hover:-translate-y-1 transition-transform flex flex-col items-center text-center">
                <SafeRobot />
                <h3 className="text-2xl font-black uppercase mb-4">100% Private</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/50 leading-relaxed">
                  Your library stays on your device. We don't track what you read.
                </p>
              </Box>

              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#f39c12] bg-white hover:-translate-y-1 transition-transform flex flex-col items-center text-center">
                <TravelerRobot />
                <h3 className="text-2xl font-black uppercase mb-4">Read Offline</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/50 leading-relaxed">
                  Download your books once and read them anywhere, even without internet.
                </p>
              </Box>

              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#e74c3c] bg-white hover:-translate-y-1 transition-transform flex flex-col items-center text-center">
                <RacingRobot />
                <h3 className="text-2xl font-black uppercase mb-4">Track Progress</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/50 leading-relaxed">
                  See how much you've read and keep your daily reading streak alive.
                </p>
              </Box>
            </SimpleGrid>
          </Container>
        </section>

        {/* Closing Quote */}
        <section className="py-32 bg-black text-white relative overflow-hidden">
          <Container size="sm" className="relative z-10 text-center">
             <Text className="text-6xl md:text-8xl font-serif italic leading-none mb-8">“</Text>
             <h2 className="text-3xl md:text-5xl font-serif italic leading-relaxed mb-12">
               Reading is a conversation. All books talk. But a good book listens as well.
             </h2>
             <Text className="text-[11px] font-black uppercase tracking-[0.5em] text-cyan-400">— Mark Haddon</Text>
          </Container>
        </section>

        {/* Ready to start? */}
        <section className="py-32 border-t-4 border-black bg-[#fdf6e3]">
          <Container size="xs" className="text-center">
            <Stack gap="xl">
              <h2 className="text-5xl font-black uppercase italic leading-none">Ready to start?</h2>
              <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-60">Just upload your EPUB file and read.</p>
              <button 
                onClick={onEnter}
                className="w-full py-8 bg-cyan-400 border-4 border-black shadow-[12px_12px_0_black] hover:translate-y-1 hover:shadow-none transition-all text-2xl font-black uppercase"
              >
                Go to Library
              </button>
            </Stack>
          </Container>
        </section>
      </main>

      <footer className="py-12 border-t-4 border-black px-10 flex flex-col md:flex-row justify-between items-center gap-8 bg-white">
        <Logo className="h-5 opacity-50" />
        <Text className="text-[10px] font-black uppercase tracking-widest opacity-30">© 2024 Zizhi Reader</Text>
      </footer>
    </Box>
  );
};

export default LandingView;
