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
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#FF6321] selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-black/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm">
            <span className="text-white font-black text-xl">Z</span>
          </div>
          <span className="font-black uppercase tracking-tighter text-xl">Zizhi</span>
        </div>
        <button 
          onClick={onEnter}
          className="bg-black text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-[#FF6321] transition-colors"
        >
          Start Reading
        </button>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
              Turn books <br />
              <span className="text-[#FF6321]">into ideas</span>
            </h1>
            <p className="text-xl md:text-2xl font-medium text-black/60 max-w-2xl mx-auto mb-10">
              Zizhi turns everything you read into something you actually remember.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onEnter}
                className="bg-black text-white px-10 py-4 rounded-full font-black text-lg flex items-center justify-center gap-2 hover:bg-[#FF6321] transition-all group"
              >
                Start Reading
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white border-2 border-black text-black px-10 py-4 rounded-full font-black text-lg hover:bg-black hover:text-white transition-all">
                See how it works
              </button>
            </div>
          </motion.div>
        </div>

        {/* Split Screen Visual */}
        <div className="grid md:grid-cols-2 gap-4 mt-12 border-2 border-black rounded-3xl overflow-hidden shadow-[20px_20px_0px_rgba(0,0,0,0.05)]">
          {/* Left: Chaos */}
          <div className="bg-[#E5E5E0] p-8 md:p-12 relative overflow-hidden min-h-[400px] flex flex-col justify-center items-center border-b md:border-b-0 md:border-r-2 border-black">
            <div className="absolute top-4 left-4 uppercase text-[10px] font-black tracking-widest opacity-40">The Chaos</div>
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Stack of messy books representation */}
              <div className="relative w-64 h-80">
                <div className="absolute top-0 left-0 w-48 h-64 bg-white border-2 border-black rotate-[-15deg] shadow-md flex flex-col p-4 gap-2">
                  <div className="h-2 w-full bg-yellow-200" />
                  <div className="h-2 w-3/4 bg-yellow-200" />
                  <div className="h-2 w-full bg-gray-100" />
                </div>
                <div className="absolute top-10 left-10 w-48 h-64 bg-white border-2 border-black rotate-[5deg] shadow-md p-4 flex flex-col gap-2">
                  <div className="h-2 w-full bg-pink-200" />
                  <div className="h-2 w-1/2 bg-pink-200" />
                  <div className="h-2 w-full bg-gray-100" />
                </div>
                <div className="absolute top-20 left-[-20px] w-48 h-64 bg-white border-2 border-black rotate-[-5deg] shadow-lg p-4">
                  <div className="h-2 w-full bg-cyan-200 mb-2" />
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-gray-100" />
                    <div className="h-1 w-full bg-gray-100" />
                    <div className="h-1 w-3/4 bg-gray-100" />
                  </div>
                </div>
                {/* Scattered highlights */}
                <div className="absolute -top-10 -right-10 w-32 h-12 bg-yellow-300 border border-black rotate-[20deg] flex items-center justify-center text-[8px] font-bold px-2">
                  FORGOTTEN HIGHLIGHT
                </div>
                <div className="absolute bottom-0 -left-20 w-32 h-12 bg-pink-300 border border-black rotate-[-10deg] flex items-center justify-center text-[8px] font-bold px-2">
                  LOST SCREENSHOT
                </div>
              </div>
            </div>
          </div>

          {/* Right: Zizhi Clean */}
          <div className="bg-white p-8 md:p-12 relative overflow-hidden min-h-[400px] flex flex-col justify-center">
            <div className="absolute top-4 left-4 uppercase text-[10px] font-black tracking-widest text-[#FF6321]">Zizhi Interface</div>
            <div className="space-y-6">
              {/* Mock UI */}
              <div className="border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_black]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="text-[10px] font-black uppercase tracking-wider">AI Summary Active</div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 rounded-full" />
                  <div className="h-3 w-5/6 bg-gray-100 rounded-full" />
                  <div className="h-3 w-4/6 bg-gray-100 rounded-full" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-black rounded-xl p-3 bg-[#F5F5F0]">
                  <div className="text-[10px] font-black uppercase mb-2">Highlights</div>
                  <div className="h-2 w-full bg-[#FF6321]/20 mb-1" />
                  <div className="h-2 w-3/4 bg-[#FF6321]/20" />
                </div>
                <div className="border-2 border-black rounded-xl p-3 bg-black text-white">
                  <div className="text-[10px] font-black uppercase mb-2">Reader</div>
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-white/20" />
                    <div className="h-1 w-full bg-white/20" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="px-4 py-2 border-2 border-black rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-[#FF6321]" />
                  Insights Resurfacing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Forgetting Problem */}
      <section className="py-24 bg-black text-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
              You don’t have a reading problem. <br />
              <span className="text-[#FF6321]">You have a forgetting problem.</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-center pt-8">
              <div className="text-left space-y-4 text-xl md:text-2xl font-medium text-white/60">
                <p>You highlight.</p>
                <p>You screenshot.</p>
                <p>You bookmark.</p>
                <p>You tell yourself you’ll come back to it.</p>
                <p className="text-white font-black text-3xl md:text-4xl mt-6 italic">You don’t.</p>
              </div>
              <div className="text-left space-y-6">
                <p className="text-xl md:text-2xl leading-relaxed">
                  Your best ideas are buried inside books you already read.
                </p>
                <div className="inline-block bg-[#FF6321] text-white px-6 py-3 rounded-sm font-black text-2xl uppercase skew-x-[-10deg]">
                  Zizhi fixes that.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: 3 Columns */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-center mb-16">
          Everything reading apps <br className="md:hidden" /> forgot to combine.
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📚",
              title: "Read",
              desc: "A beautiful eBook reader built in. Highlight as you go. No exporting. No syncing headaches."
            },
            {
              icon: "🧠",
              title: "Remember",
              desc: "All your highlights live in one place. Revisit them daily. Turn them into posts. Notes. Ideas."
            },
            {
              icon: "⚡",
              title: "Understand Faster",
              desc: "AI summaries when you’re short on time. Audiobook-style breakdowns for busy days."
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 border-2 border-black rounded-3xl bg-white shadow-[10px_10px_0px_black] flex flex-col gap-4"
            >
              <div className="text-4xl">{item.icon}</div>
              <h3 className="text-2xl font-black uppercase">{item.title}</h3>
              <p className="text-black/60 font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 4: Before vs After */}
      <section className="py-24 bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-center mb-20">
            Reading should compound.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Before */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 space-y-8">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <h3 className="text-2xl font-black uppercase">Before Zizhi</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "10 unfinished books",
                  "500 forgotten highlights",
                  "Zero applied ideas"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl text-white/40">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-[#FF6321] rounded-3xl p-10 space-y-8 shadow-[0_0_50px_rgba(255,99,33,0.3)]">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-white" />
                <h3 className="text-2xl font-black uppercase">After Zizhi</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "1 organized brain",
                  "Insights resurfacing automatically",
                  "Reading that compounds"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl font-bold">
                    <div className="w-2 h-2 rounded-full bg-white" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Social Proof */}
      <section className="py-32 bg-[#F5F5F0] border-y border-black/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <QuoteIcon className="w-12 h-12 mx-auto mb-8 text-[#FF6321] opacity-50" />
          <h2 className="text-3xl md:text-5xl font-serif italic leading-tight mb-8">
            “For people who don’t read to look smart. <br className="hidden md:block" />
            They read to think better.”
          </h2>
        </div>
      </section>

      {/* Section 6: Philosophy */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
              The internet <br />
              rewards noise. <br />
              <span className="text-[#FF6321]">Zizhi rewards thinking.</span>
            </h2>
          </div>
          <div className="space-y-8">
            <p className="text-2xl font-medium text-black/70 leading-relaxed">
              Less scrolling. More depth. Memory as a superpower.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 border-2 border-black rounded-2xl bg-white">
                <Layers className="w-6 h-6 mb-4 text-[#FF6321]" />
                <div className="font-black uppercase text-sm">Depth First</div>
              </div>
              <div className="p-6 border-2 border-black rounded-2xl bg-white">
                <MousePointer2 className="w-6 h-6 mb-4 text-[#FF6321]" />
                <div className="font-black uppercase text-sm">Active Recall</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-black text-white text-center px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
            If you’re going to read, <br />
            you might as well <span className="text-[#FF6321]">remember.</span>
          </h2>
          <button 
            onClick={onEnter}
            className="bg-[#FF6321] text-white px-12 py-6 rounded-full font-black text-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,99,33,0.5)]"
          >
            Start reading
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black flex items-center justify-center rounded-sm">
            <span className="text-white font-black text-sm">Z</span>
          </div>
          <span className="font-black uppercase tracking-tighter text-sm">Zizhi</span>
        </div>
        <div className="text-black/40 text-xs font-bold uppercase tracking-widest">
          © 2026 Zizhi — Built for thinkers
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
