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
      <nav className="fixed top-0 w-full z-50 bg-[#F5F5F0] border-b-4 border-black px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black flex items-center justify-center rounded-none shadow-[4px_4px_0px_#FF6321]">
            <span className="text-white font-black text-2xl">Z</span>
          </div>
          <span className="font-black uppercase tracking-tighter text-2xl">Zizhi</span>
        </div>
        <button 
          onClick={onEnter}
          className="bg-[#FF6321] text-white px-6 py-2 border-2 border-black shadow-[4px_4px_0px_black] font-black uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          Start Reading
        </button>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-block bg-yellow-300 border-2 border-black px-4 py-1 mb-6 rotate-[-2deg] font-black uppercase tracking-widest text-xs">
              The future of reading is here
            </div>
            <h1 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter leading-[0.8] mb-8">
              Turn books <br />
              <span className="text-[#FF6321] bg-black px-4 inline-block rotate-[1deg]">into ideas</span>
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-black max-w-2xl mx-auto mb-12 leading-tight">
              Zizhi turns everything you read into something you actually remember. No more lost highlights.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={onEnter}
                className="bg-black text-white px-12 py-5 border-4 border-black shadow-[10px_10px_0px_#FF6321] font-black text-xl flex items-center justify-center gap-3 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all uppercase group"
              >
                Start Reading
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
              <button className="bg-white border-4 border-black text-black px-12 py-5 shadow-[10px_10px_0px_black] font-black text-xl hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all uppercase">
                How it works
              </button>
            </div>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="w-full border-y-4 border-black py-4 overflow-hidden bg-cyan-400 mb-20 rotate-[-1deg]">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-2xl font-black uppercase mx-8 flex items-center gap-4">
                <Sparkles className="w-6 h-6" />
                Stop Forgetting
                <Sparkles className="w-6 h-6" />
                Read Better
                <Sparkles className="w-6 h-6" />
                Think Deeper
              </span>
            ))}
          </div>
        </div>

        {/* Split Screen Visual */}
        <div className="grid md:grid-cols-2 gap-0 border-4 border-black overflow-hidden shadow-[24px_24px_0px_black]">
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
      <section className="py-32 bg-black text-white overflow-hidden border-y-8 border-[#FF6321]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] text-center">
              You don’t have a <br />
              <span className="bg-[#FF6321] text-black px-4 inline-block mt-2">reading problem.</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-16 items-center pt-12">
              <div className="space-y-6 text-2xl md:text-4xl font-black uppercase italic">
                <p className="text-white/40 hover:text-white transition-colors">You highlight.</p>
                <p className="text-white/40 hover:text-white transition-colors">You screenshot.</p>
                <p className="text-white/40 hover:text-white transition-colors">You bookmark.</p>
                <p className="text-white/40 hover:text-white transition-colors">You tell yourself you’ll come back to it.</p>
                <p className="text-[#FF6321] text-5xl md:text-7xl mt-8 not-italic underline decoration-8">You don’t.</p>
              </div>
              <div className="space-y-8">
                <p className="text-2xl md:text-3xl font-bold leading-tight">
                  Your best ideas are buried inside books you already read. They are dead weight.
                </p>
                <div className="inline-block bg-cyan-400 text-black px-8 py-4 border-4 border-white font-black text-3xl uppercase rotate-[-3deg] shadow-[8px_8px_0px_white]">
                  Zizhi fixes that.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: 3 Columns */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-center mb-24 leading-[0.9]">
          Everything reading apps <br /> forgot to combine.
        </h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              num: "01",
              icon: "📚",
              title: "Read",
              color: "bg-pink-400",
              desc: "A beautiful eBook reader built in. Highlight as you go. No exporting. No syncing headaches."
            },
            {
              num: "02",
              icon: "🧠",
              title: "Remember",
              color: "bg-yellow-300",
              desc: "All your highlights live in one place. Revisit them daily. Turn them into posts. Notes. Ideas."
            },
            {
              num: "03",
              icon: "⚡",
              title: "Understand",
              color: "bg-cyan-400",
              desc: "AI summaries when you’re short on time. Audiobook-style breakdowns for busy days."
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ translate: "-8px -8px" }}
              className={`p-10 border-4 border-black rounded-none ${item.color} shadow-[12px_12px_0px_black] flex flex-col gap-6 relative group`}
            >
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-black text-white flex items-center justify-center font-black text-2xl border-4 border-white">
                {item.num}
              </div>
              <div className="text-6xl mt-4">{item.icon}</div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">{item.title}</h3>
              <p className="text-black font-bold text-lg leading-tight">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 4: Before vs After */}
      <section className="py-32 bg-[#1A1A1A] text-white border-y-4 border-black">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-center mb-24">
            Reading should <br className="md:hidden" /> <span className="text-cyan-400 italic">compound.</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-0 border-4 border-white shadow-[20px_20px_0px_#FF6321]">
            {/* Before */}
            <div className="bg-white text-black p-12 space-y-10 border-b-4 md:border-b-0 md:border-r-4 border-black">
              <div className="flex items-center gap-4">
                <XCircle className="w-10 h-10 text-red-600" />
                <h3 className="text-3xl font-black uppercase tracking-tighter">Before Zizhi</h3>
              </div>
              <ul className="space-y-8">
                {[
                  "10 unfinished books",
                  "500 forgotten highlights",
                  "Zero applied ideas"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-6 text-2xl font-black uppercase opacity-40">
                    <div className="w-4 h-4 bg-black" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-[#FF6321] p-12 space-y-10">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-10 h-10 text-white" />
                <h3 className="text-3xl font-black uppercase tracking-tighter">After Zizhi</h3>
              </div>
              <ul className="space-y-8">
                {[
                  "1 organized brain",
                  "Insights resurfacing daily",
                  "Reading that compounds"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-6 text-2xl font-black uppercase">
                    <div className="w-4 h-4 bg-white shadow-[4px_4px_0px_black]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Social Proof */}
      <section className="py-32 bg-yellow-300 border-y-4 border-black relative overflow-hidden">
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(black 2px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <QuoteIcon className="w-16 h-16 mx-auto mb-10 text-black" />
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight mb-8">
            “For people who don’t read to look smart. <br />
            They read to <span className="bg-black text-white px-4">think better.</span>”
          </h2>
          <div className="font-black uppercase tracking-widest text-sm">— The Zizhi Philosophy</div>
        </div>
      </section>

      {/* Section 6: Philosophy */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-10">
              The internet <br />
              rewards <span className="text-pink-500">noise.</span> <br />
              <span className="text-[#FF6321]">Zizhi rewards thinking.</span>
            </h2>
          </div>
          <div className="space-y-12">
            <p className="text-3xl font-bold text-black leading-tight">
              Less scrolling. More depth. Memory as a superpower. We build tools for the deep thinkers.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="p-8 border-4 border-black rounded-none bg-white shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <Layers className="w-10 h-10 mb-6 text-[#FF6321]" />
                <div className="font-black uppercase text-xl tracking-tighter">Depth First</div>
              </div>
              <div className="p-8 border-4 border-black rounded-none bg-white shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <MousePointer2 className="w-10 h-10 mb-6 text-cyan-400" />
                <div className="font-black uppercase text-xl tracking-tighter">Active Recall</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 bg-black text-white text-center px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-[#FF6321]" />
        <div className="max-w-4xl mx-auto space-y-16">
          <h2 className="text-6xl md:text-[9rem] font-black uppercase tracking-tighter leading-[0.8]">
            If you’re going <br className="hidden md:block" /> to read, <br />
            you might as well <span className="text-[#FF6321]">remember.</span>
          </h2>
          <button 
            onClick={onEnter}
            className="bg-[#FF6321] text-white px-16 py-8 border-4 border-white shadow-[12px_12px_0px_white] font-black text-3xl uppercase hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
          >
            Start reading now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t-4 border-black bg-[#F5F5F0] flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black flex items-center justify-center rounded-none shadow-[4px_4px_0px_#FF6321]">
            <span className="text-white font-black text-2xl">Z</span>
          </div>
          <span className="font-black uppercase tracking-tighter text-2xl">Zizhi</span>
        </div>
        <div className="text-black font-black uppercase tracking-widest text-sm">
          © 2026 Zizhi — Built for the deep thinkers
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
