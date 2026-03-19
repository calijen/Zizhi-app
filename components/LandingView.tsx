import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Quote as QuoteIcon,
  Sparkles,
  Layers,
  MousePointer2
} from 'lucide-react';

interface LandingViewProps {
  onEnter: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onEnter }) => {
  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[var(--color-background)] text-[var(--color-primary-text)] font-sans selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--color-surface)] border-b-4 border-black px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 border-4 border-black bg-cyan-400 flex items-center justify-center rounded-none shadow-[2px_2px_0_black]">
            <span className="text-black font-black text-2xl uppercase">Z</span>
          </div>
          <span className="font-black uppercase tracking-tighter text-2xl">Zizhi</span>
        </div>
        <button 
          onClick={onEnter}
          className="bg-yellow-400 text-black px-6 py-2 rounded-none border-4 border-black font-black uppercase text-sm shadow-[4px_4px_0_black] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
        >
          Start Reading
        </button>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
              Turn books <br />
              <span className="bg-pink-500 text-white inline-block px-6 py-2 border-4 border-black shadow-[8px_8px_0_black] rotate-2 mt-4 uppercase">into ideas</span>
            </h1>
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_black] max-w-2xl mx-auto mb-12 -rotate-1">
              <p className="text-2xl font-black uppercase tracking-widest text-black">
                Zizhi turns everything you read into something you actually remember.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={onEnter}
                className="bg-cyan-400 text-black px-12 py-5 rounded-none border-4 border-black font-black text-xl flex items-center justify-center gap-3 uppercase shadow-[8px_8px_0_black] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_black] active:translate-y-2 active:translate-x-2 active:shadow-none transition-all group"
              >
                Start Reading
                <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </button>
              <button className="bg-white text-black px-12 py-5 rounded-none border-4 border-black font-black text-xl uppercase shadow-[8px_8px_0_black] hover:bg-black hover:text-white transition-all">
                See how it works
              </button>
            </div>
          </motion.div>
        </div>

        {/* Split Screen Visual */}
        <div className="grid md:grid-cols-2 gap-0 mt-20 border-8 border-black rounded-none overflow-hidden shadow-[16px_16px_0_black] bg-white">
          {/* Left: Chaos */}
          <div className="bg-red-400 p-8 md:p-12 relative min-h-[400px] flex flex-col justify-center items-center border-b-8 md:border-b-0 md:border-r-8 border-black">
            <div className="absolute top-6 left-6 bg-black text-white px-3 py-1 font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_var(--color-border-color)]">The Chaos</div>
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Stack of messy books representation */}
              <div className="relative w-64 h-80">
                <div className="absolute top-0 left-0 w-48 h-64 bg-white border-4 border-black rotate-[-15deg] shadow-[6px_6px_0_rgba(0,0,0,0.5)] flex flex-col p-4 gap-2">
                  <div className="h-4 w-full bg-yellow-400 border-2 border-black" />
                  <div className="h-4 w-3/4 bg-yellow-400 border-2 border-black" />
                  <div className="h-4 w-full bg-gray-200 border-2 border-black" />
                </div>
                <div className="absolute top-10 left-10 w-48 h-64 bg-white border-4 border-black rotate-[5deg] shadow-[6px_6px_0_rgba(0,0,0,0.5)] p-4 flex flex-col gap-2">
                  <div className="h-4 w-full bg-pink-500 border-2 border-black" />
                  <div className="h-4 w-1/2 bg-pink-500 border-2 border-black" />
                  <div className="h-4 w-full bg-gray-200 border-2 border-black" />
                </div>
                <div className="absolute top-20 left-[-20px] w-48 h-64 bg-white border-4 border-black rotate-[-5deg] shadow-[8px_8px_0_rgba(0,0,0,0.7)] p-4 flex flex-col justify-between">
                  <div className="h-4 w-full bg-cyan-400 mb-2 border-2 border-black" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-800" />
                    <div className="h-3 w-full bg-gray-800" />
                    <div className="h-3 w-3/4 bg-gray-800" />
                  </div>
                </div>
                {/* Scattered highlights */}
                <div className="absolute -top-10 -right-10 px-4 py-2 bg-yellow-400 border-4 border-black rotate-[20deg] flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_black]">
                  Forgotten Highlight
                </div>
                <div className="absolute bottom-0 -left-20 px-4 py-2 bg-cyan-400 border-4 border-black rotate-[-10deg] flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_black]">
                  Lost Screenshot
                </div>
              </div>
            </div>
          </div>

          {/* Right: Zizhi Clean */}
          <div className="bg-[var(--color-surface)] p-8 md:p-12 relative min-h-[400px] flex flex-col justify-center">
            <div className="absolute top-6 left-6 bg-yellow-400 text-black px-3 py-1 font-black uppercase text-xs tracking-widest border-4 border-black shadow-[4px_4px_0_black]">Zizhi Interface</div>
            <div className="space-y-6 mt-12">
              {/* Mock UI */}
              <div className="border-4 border-black p-4 shadow-[6px_6px_0_black] bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-black" />
                  <div className="text-xs font-black uppercase tracking-widest">AI Summary Active</div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-black" />
                  <div className="h-4 w-5/6 bg-black" />
                  <div className="h-4 w-4/6 bg-black" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="border-4 border-black p-4 bg-pink-500 shadow-[4px_4px_0_black] text-white">
                  <div className="text-xs font-black uppercase tracking-widest mb-3">Highlights</div>
                  <div className="h-3 w-full bg-black mb-2" />
                  <div className="h-3 w-3/4 bg-black" />
                </div>
                <div className="border-4 border-black p-4 bg-cyan-400 shadow-[4px_4px_0_black] text-black">
                  <div className="text-xs font-black uppercase tracking-widest mb-3">Reader</div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-black" />
                    <div className="h-2 w-full bg-black" />
                    <div className="h-2 w-2/3 bg-black" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <div className="px-6 py-3 bg-white border-4 border-black text-xs font-black uppercase flex items-center gap-3 shadow-[4px_4px_0_black]">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  Insights Resurfacing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Forgetting Problem */}
      <section className="py-24 bg-black text-white border-y-8 border-black">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight text-[var(--color-surface)]">
              You don’t have a <br/> reading problem. <br />
              <span className="text-yellow-400 inline-block mt-4 bg-black px-4 py-2 border-4 border-yellow-400 skew-x-[-5deg]">You have a forgetting problem.</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-center pt-8 border-t-4 border-white/20 text-left">
              <div className="space-y-6 text-2xl font-black uppercase tracking-widest text-cyan-400">
                <p>You highlight.</p>
                <p className="text-pink-500">You screenshot.</p>
                <p>You bookmark.</p>
                <p className="text-white text-xl">You tell yourself you’ll come back to it.</p>
                <div className="inline-block px-4 py-2 bg-red-500 text-white border-4 border-white mt-4 rotate-[2deg]">
                  <p className="text-4xl">YOU DON’T.</p>
                </div>
              </div>
              <div className="space-y-8">
                <p className="text-3xl font-black leading-relaxed text-white">
                  Your best ideas are buried inside books you already read.
                </p>
                <div className="inline-block bg-white text-black px-8 py-4 border-4 border-yellow-400 font-black text-3xl uppercase shadow-[8px_8px_0_var(--color-primary)]">
                  Zizhi fixes that.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: 3 Columns */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-center mb-20 bg-cyan-400 inline-block mx-auto border-4 border-black px-8 py-4 shadow-[8px_8px_0_black] -rotate-1">
          Everything reading apps <br className="md:hidden" /> forgot to combine.
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📚",
              title: "Read",
              desc: "A beautiful eBook reader built in. Highlight as you go. No exporting. No syncing headaches.",
              color: "bg-yellow-400"
            },
            {
              icon: "🧠",
              title: "Remember",
              desc: "All your highlights live in one place. Revisit them daily. Turn them into posts. Notes. Ideas.",
              color: "bg-pink-500"
            },
            {
              icon: "⚡",
              title: "Understand",
              desc: "AI summaries when you’re short on time. Audiobook-style breakdowns for busy days.",
              color: "bg-cyan-400"
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -8, x: -8 }}
              className={`p-10 border-4 border-black ${item.color} shadow-[8px_8px_0_black] flex flex-col gap-6`}
            >
              <div className="text-5xl bg-white w-20 h-20 flex items-center justify-center border-4 border-black shadow-[4px_4px_0_black] mb-4">{item.icon}</div>
              <h3 className="text-4xl font-black uppercase tracking-tighter text-black">{item.title}</h3>
              <p className="text-black font-bold uppercase tracking-widest leading-relaxed text-sm">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 4: Before vs After */}
      <section className="py-24 bg-[var(--color-surface)] border-y-8 border-black">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-center mb-20">
            Reading should <span className="underline decoration-8 decoration-pink-500">compound.</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Before */}
            <div className="bg-white border-4 border-black p-12 space-y-8 shadow-[8px_8px_0_black]">
              <div className="flex items-center gap-4 border-b-4 border-black pb-6 mb-6">
                <div className="p-2 bg-red-400 border-4 border-black">
                  <XCircle className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-4xl font-black uppercase text-black">Before Zizhi</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "10 unfinished books",
                  "500 forgotten highlights",
                  "Zero applied ideas"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-6 text-2xl font-black tracking-widest uppercase">
                    <div className="w-6 h-6 bg-black flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-yellow-400 border-4 border-black p-12 space-y-8 shadow-[12px_12px_0_black]">
              <div className="flex items-center gap-4 border-b-4 border-black pb-6 mb-6">
                <div className="p-2 bg-white border-4 border-black">
                  <CheckCircle2 className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-4xl font-black uppercase text-black">After Zizhi</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "1 organized brain",
                  "Insights resurfacing",
                  "Reading that compounds"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-6 text-2xl font-black tracking-widest uppercase text-black">
                    <div className="w-6 h-6 bg-white border-4 border-black flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Social Proof */}
      <section className="py-32 bg-pink-500 text-black border-b-8 border-black">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="bg-white inline-block p-4 border-4 border-black shadow-[6px_6px_0_black] mb-12 -rotate-2">
            <QuoteIcon className="w-16 h-16 text-black" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest leading-tight border-4 border-black bg-white p-12 shadow-[12px_12px_0_black]">
            “For people who don’t read to look smart. <br className="hidden md:block" />
            They read to think better.”
          </h2>
        </div>
      </section>

      {/* Section 6: Philosophy */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] text-black">
              The internet <br />
              <span className="bg-black text-white px-4 inline-block my-2">rewards noise.</span> <br />
              Zizhi rewards <br /> <span className="text-cyan-400 drop-shadow-[4px_4px_0_black]">thinking.</span>
            </h2>
          </div>
          <div className="space-y-12">
            <div className="bg-yellow-400 border-4 border-black p-8 shadow-[8px_8px_0_black]">
              <p className="text-3xl font-black uppercase tracking-widest leading-relaxed text-black">
                Less scrolling. More depth. Memory as a superpower.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="p-8 border-4 border-black bg-white shadow-[6px_6px_0_black] -rotate-2">
                <Layers className="w-12 h-12 mb-6 text-pink-500" />
                <div className="font-black uppercase text-xl">Depth First</div>
              </div>
              <div className="p-8 border-4 border-black bg-white shadow-[6px_6px_0_black] rotate-2">
                <MousePointer2 className="w-12 h-12 mb-6 text-cyan-400" />
                <div className="font-black uppercase text-xl">Active Recall</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 bg-cyan-400 text-black border-y-8 border-black text-center px-6 relative overflow-hidden">
        {/* Background brutalist elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500 border-4 border-black rounded-full mix-blend-multiply opacity-50 blur-sm animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-400 border-4 border-black mix-blend-multiply opacity-50 blur-sm" />
        
        <div className="max-w-4xl mx-auto space-y-16 relative z-10">
          <div className="bg-white border-8 border-black p-12 shadow-[16px_16px_0_black] -rotate-1">
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
              If you’re going to read, <br />
              you might as well <br />
              <span className="text-pink-500 underline decoration-8 decoration-black mt-4 inline-block">remember.</span>
            </h2>
          </div>
          <button 
            onClick={onEnter}
            className="bg-black text-white px-16 py-8 rounded-none border-4 border-black font-black uppercase tracking-widest text-3xl hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[16px_16px_0_rgba(0,0,0,0.3)] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all shadow-[8px_8px_0_rgba(0,0,0,0.5)]"
          >
            Start reading right now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-8 border-black bg-[var(--color-surface)] flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-4 border-black bg-black flex items-center justify-center rounded-none shadow-[2px_2px_0_var(--color-primary-text)]">
            <span className="text-white font-black text-xl">Z</span>
          </div>
          <span className="font-black uppercase tracking-tighter text-2xl">Zizhi</span>
        </div>
        <div className="text-black text-sm font-black uppercase tracking-widest bg-yellow-400 border-2 border-black px-4 py-2 shadow-[2px_2px_0_black]">
          © 2026 Zizhi — Built for thinkers
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
