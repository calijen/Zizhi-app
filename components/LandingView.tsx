
import React from 'react';
import { Box, Stack, Text, SimpleGrid, Container, Group, Divider } from '@mantine/core';
import { Logo, IconLibrary, IconQuote, IconPlay, IconCloud, IconLayoutGrid, IconLayoutList, IconUpload, IconSettings, IconUser } from './icons';

interface LandingViewProps {
  onEnter: () => void;
}

const SplitScreenVisual = () => (
  <Box className="relative w-full aspect-video md:aspect-square lg:aspect-video border-4 border-black shadow-[12px_12px_0_black] overflow-hidden flex">
    {/* Left: Chaos */}
    <Box className="flex-1 bg-stone-200 border-r-2 border-black p-4 relative overflow-hidden">
      <Text className="text-[8px] font-black uppercase opacity-30 mb-4">The "Later" Pile</Text>
      <Stack gap={4}>
        {[...Array(12)].map((_, i) => (
          <Box 
            key={i} 
            className="h-4 bg-stone-400 border-2 border-black" 
            style={{ 
              width: `${40 + Math.random() * 50}%`,
              transform: `rotate(${(Math.random() - 0.5) * 10}deg) translateX(${Math.random() * 20}px)`,
              opacity: 0.5 + Math.random() * 0.5
            }} 
          />
        ))}
      </Stack>
      <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12">
        <Box className="p-2 bg-yellow-200 border-2 border-black shadow-[4px_4px_0_black] w-32">
          <Text className="text-[8px] font-bold italic">"I'll definitely reread this part tomorrow..."</Text>
        </Box>
      </Box>
      <Box className="absolute bottom-4 right-4 opacity-20">
        <IconQuote size={48} />
      </Box>
    </Box>

    {/* Right: Zizhi */}
    <Box className="flex-1 bg-white p-4 flex flex-col gap-4">
      <Text className="text-[8px] font-black uppercase text-cyan-600">Zizhi Interface</Text>
      <Box className="flex-1 border-2 border-black p-2 flex flex-col gap-2">
        <Group justify="space-between">
          <Box className="w-12 h-2 bg-black" />
          <Box className="w-4 h-4 bg-cyan-400 border-2 border-black" />
        </Group>
        <Box className="w-full h-16 bg-stone-100 border-2 border-black p-2">
          <Stack gap={2}>
            <Box className="w-3/4 h-1 bg-black/20" />
            <Box className="w-full h-1 bg-black/20" />
            <Box className="w-1/2 h-1 bg-black/20" />
          </Stack>
        </Box>
        <Box className="flex-1 border-2 border-black bg-pink-50 p-2">
          <Text className="text-[6px] font-black uppercase mb-1">AI Summary</Text>
          <Stack gap={1}>
            <Box className="w-full h-1 bg-pink-200" />
            <Box className="w-full h-1 bg-pink-200" />
            <Box className="w-2/3 h-1 bg-pink-200" />
          </Stack>
        </Box>
      </Box>
    </Box>
    
    <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-3 py-1 font-black text-[10px] uppercase rotate-[-5deg] border-2 border-white">
      VS
    </Box>
  </Box>
);

const LandingView: React.FC<LandingViewProps> = ({ onEnter }) => {
  return (
    <Box className="h-screen overflow-y-auto bg-[#fdf6e3] text-black selection:bg-cyan-300 no-scrollbar">
      {/* 1. Hero Section */}
      <nav className="h-20 border-b-4 border-black px-8 flex items-center justify-between sticky top-0 bg-[#fdf6e3] z-[500]">
        <Logo className="h-6 w-auto" />
        <button 
          onClick={onEnter}
          className="bg-black text-white px-6 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-cyan-500 hover:text-black transition-all border-2 border-black"
        >
          Start Reading
        </button>
      </nav>

      <main>
        <section className="py-16 md:py-32 border-b-4 border-black">
          <Container size="lg">
            <Stack gap={64} align="center" className="text-center">
              <Stack gap="xl" align="center">
                <Box className="bg-pink-500 border-4 border-black inline-block px-4 py-1 shadow-[4px_4px_0_black] w-fit">
                  <Text className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Retention First</Text>
                </Box>
                <h1 className="text-6xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter italic">
                  Turn books <br />
                  into <span className="text-cyan-500">ideas.</span>
                </h1>
                <p className="text-xl md:text-2xl font-serif italic text-black/70 leading-relaxed max-w-2xl">
                  Zizhi turns everything you read into something you actually remember.
                </p>
                <Group gap="lg" pt="xl" justify="center">
                  <button 
                    onClick={onEnter}
                    className="px-10 py-5 bg-yellow-400 border-4 border-black shadow-[8px_8px_0_black] hover:translate-y-1 hover:shadow-none transition-all text-lg font-black uppercase tracking-widest"
                  >
                    Start Reading
                  </button>
                  <button 
                    className="px-10 py-5 bg-white border-4 border-black shadow-[8px_8px_0_black] hover:translate-y-1 hover:shadow-none transition-all text-lg font-black uppercase tracking-widest"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    See how it works
                  </button>
                </Group>
              </Stack>
              <Box className="w-full max-w-5xl mx-auto">
                <SplitScreenVisual />
              </Box>
            </Stack>
          </Container>
        </section>

        {/* 2. The Pain Section */}
        <section className="py-24 bg-white border-b-4 border-black">
          <Container size="sm" className="text-center">
            <Stack gap="xl">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic leading-none">
                You don’t have a reading problem. <br />
                <span className="text-pink-500">You have a forgetting problem.</span>
              </h2>
              <Box className="text-xl font-serif italic text-black/80 space-y-6 max-w-xl mx-auto">
                <p>You highlight. You screenshot. You bookmark.</p>
                <p>You tell yourself you’ll come back to it.</p>
                <p className="text-3xl font-black uppercase not-italic text-black">You don’t.</p>
                <p>Your best ideas are buried inside books you already read.</p>
                <p className="font-black not-italic uppercase tracking-widest text-cyan-600">Zizhi fixes that.</p>
              </Box>
            </Stack>
          </Container>
        </section>

        {/* 3. The “3-in-1” Section */}
        <section id="features" className="py-24 bg-[#fdf6e3] border-b-4 border-black">
          <Container size="lg">
            <header className="mb-20 text-center">
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">Everything reading apps forgot to combine.</h2>
              <div className="h-2 w-32 bg-cyan-400 mx-auto mt-4 border-2 border-black" />
            </header>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40}>
              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#00d1ff] bg-white">
                <Text className="text-5xl mb-6">📚</Text>
                <h3 className="text-2xl font-black uppercase mb-4">Read</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/60 leading-relaxed">
                  A beautiful eBook reader built in. Highlight as you go. No exporting. No syncing headaches.
                </p>
              </Box>

              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#ff416c] bg-white">
                <Text className="text-5xl mb-6">🧠</Text>
                <h3 className="text-2xl font-black uppercase mb-4">Remember</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/60 leading-relaxed">
                  All your highlights live in one place. Revisit them daily. Turn them into posts. Notes. Ideas.
                </p>
              </Box>

              <Box className="p-10 border-4 border-black shadow-[12px_12px_0_#ffeb3b] bg-white">
                <Text className="text-5xl mb-6">⚡</Text>
                <h3 className="text-2xl font-black uppercase mb-4">Understand Faster</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-black/60 leading-relaxed">
                  AI summaries when you’re short on time. Audiobook-style breakdowns for busy days.
                </p>
              </Box>
            </SimpleGrid>
          </Container>
        </section>

        {/* 4. Show the Transformation */}
        <section className="py-24 bg-black text-white border-b-4 border-black">
          <Container size="lg">
            <Stack gap={60}>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic text-center">Reading should <span className="text-cyan-400 underline decoration-8 underline-offset-8">compound.</span></h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Box className="p-12 border-4 border-white/20 bg-white/5">
                  <Text className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-white/40">Before Zizhi</Text>
                  <Stack gap="lg">
                    <Group gap="md"><Box className="w-4 h-4 border-2 border-pink-500" /><Text className="font-black uppercase italic">10 unfinished books</Text></Group>
                    <Group gap="md"><Box className="w-4 h-4 border-2 border-pink-500" /><Text className="font-black uppercase italic">500 forgotten highlights</Text></Group>
                    <Group gap="md"><Box className="w-4 h-4 border-2 border-pink-500" /><Text className="font-black uppercase italic">Zero applied ideas</Text></Group>
                  </Stack>
                </Box>

                <Box className="p-12 border-4 border-cyan-400 bg-cyan-400/10">
                  <Text className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-cyan-400">After Zizhi</Text>
                  <Stack gap="lg">
                    <Group gap="md"><Box className="w-4 h-4 bg-cyan-400 border-2 border-black" /><Text className="font-black uppercase italic">1 organized brain</Text></Group>
                    <Group gap="md"><Box className="w-4 h-4 bg-cyan-400 border-2 border-black" /><Text className="font-black uppercase italic">Insights resurfacing automatically</Text></Group>
                    <Group gap="md"><Box className="w-4 h-4 bg-cyan-400 border-2 border-black" /><Text className="font-black uppercase italic">Reading that compounds</Text></Group>
                  </Stack>
                </Box>
              </div>
            </Stack>
          </Container>
        </section>

        {/* 5. Social Proof Section */}
        <section className="py-24 bg-white border-b-4 border-black">
          <Container size="sm" className="text-center">
            <Stack gap="xl">
              <Text className="text-6xl md:text-8xl font-serif italic leading-none text-stone-200">“</Text>
              <h2 className="text-3xl md:text-5xl font-serif italic leading-tight mb-8">
                For people who don’t read to look smart. <br />
                <span className="not-italic font-black uppercase text-black">They read to think better.</span>
              </h2>
              <Box className="h-1 w-24 bg-black mx-auto" />
              <Text className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">The Zizhi Philosophy</Text>
            </Stack>
          </Container>
        </section>

        {/* 6. Product Walkthrough */}
        <section className="py-24 bg-[#fdf6e3] border-b-4 border-black">
          <Container size="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={30}>
              {[
                { title: "Reader interface", icon: IconLayoutList, text: "Highlight once. Keep forever." },
                { title: "Highlight review", icon: IconQuote, text: "Your ideas, resurfaced." },
                { title: "AI summary mode", icon: IconPlay, text: "5-minute understanding." },
                { title: "Share-to-social", icon: IconUpload, text: "Turn insight into output." }
              ].map((item, i) => (
                <Box key={i} className="group">
                  <Box className="aspect-[4/5] bg-white border-4 border-black shadow-[8px_8px_0_black] mb-6 flex items-center justify-center group-hover:-translate-y-2 transition-transform">
                    <item.icon size={64} className="text-black/10 group-hover:text-cyan-500 transition-colors" />
                  </Box>
                  <Text className="text-[10px] font-black uppercase tracking-widest mb-2">{item.title}</Text>
                  <Text className="font-serif italic text-lg">“{item.text}”</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Container>
        </section>

        {/* 7. The Philosophy Section */}
        <section className="py-32 bg-white border-b-4 border-black">
          <Container size="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <Stack gap="xl">
                <h2 className="text-5xl font-black uppercase italic leading-none">
                  The internet rewards noise. <br />
                  <span className="text-cyan-500">Zizhi rewards thinking.</span>
                </h2>
                <Box className="text-lg font-serif italic text-black/70 space-y-4">
                  <p>We built Zizhi for the deep thinkers. The ones who value quality over quantity.</p>
                  <p>Less scrolling. More depth. Memory as a superpower.</p>
                  <p>It's time to stop consuming and start compounding.</p>
                </Box>
              </Stack>
              <Box className="p-12 bg-black text-white border-4 border-black shadow-[16px_16px_0_#ff416c]">
                <Stack gap="md">
                  <Logo className="h-6 text-white" />
                  <Divider color="white" opacity={0.2} />
                  <Text className="text-sm font-bold uppercase tracking-widest">Manifesto v1.0</Text>
                  <Text className="text-xs opacity-60 leading-relaxed">
                    In an age of infinite distraction, the ability to retain and synthesize information is the ultimate competitive advantage.
                  </Text>
                </Stack>
              </Box>
            </div>
          </Container>
        </section>

        {/* 8. Final CTA */}
        <section className="py-32 bg-yellow-400 border-b-4 border-black">
          <Container size="xs" className="text-center">
            <Stack gap="xl">
              <h2 className="text-5xl font-black uppercase italic leading-none">
                If you’re going to read, <br />
                you might as well remember.
              </h2>
              <button 
                onClick={onEnter}
                className="w-full py-8 bg-black text-white border-4 border-black shadow-[12px_12px_0_white] hover:translate-y-1 hover:shadow-none transition-all text-2xl font-black uppercase tracking-widest"
              >
                Start Reading
              </button>
            </Stack>
          </Container>
        </section>
      </main>

      <footer className="py-12 px-10 flex flex-col md:flex-row justify-between items-center gap-8 bg-white">
        <Logo className="h-5 opacity-50" />
        <Text className="text-[10px] font-black uppercase tracking-widest opacity-30">© 2026 Zizhi Reader — Built for Thinkers</Text>
      </footer>
    </Box>
  );
};

export default LandingView;
