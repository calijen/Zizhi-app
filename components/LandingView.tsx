import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from './icons';

interface LandingViewProps {
  onEnter: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#fbf6e1] text-[#1a110a] font-body selection:bg-pink-400 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#fbf6e1]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-3">
          <Logo className="h-6 w-auto text-black" />
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[13px] font-bold uppercase tracking-wider">
          <a href="#how-it-works" className="hover:text-pink-500 transition-colors">How it works</a>
          <a href="#philosophy" className="hover:text-pink-500 transition-colors">The philosophy</a>
          <a href="#features" className="hover:text-pink-500 transition-colors">Features</a>
        </div>

        <button 
          onClick={onEnter}
          className="bg-yellow-400 text-black px-5 py-2 border-2 border-black shadow-[4px_4px_0px_black] font-heading text-[11px] uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          Start Reading
        </button>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-48 pb-20 px-6 max-w-5xl mx-auto relative">
        {/* Doodle 1: Reading doesn't have to be boring */}
        <div className="absolute left-[-20px] md:left-[-150px] top-[40%] md:top-[60%] rotate-[-20deg] font-doodle text-lg md:text-2xl text-black/60 max-w-[150px] pointer-events-none hidden md:block">
          Reading doesn't have to be boring ;-)
        </div>

        {/* Doodle 2: Cat with bubble */}
        <div className="absolute right-[-40px] md:right-[-200px] top-[60%] rotate-[10deg] pointer-events-none hidden md:block">
          <div className="relative">
             <div className="bg-white border-2 border-black p-3 rounded-2xl font-doodle text-sm mb-4 shadow-[4px_4px_0px_black]">
               I couldn't help but notice that...
               <div className="absolute bottom-[-10px] left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-black rotate-45" />
             </div>
             <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Phoebe&backgroundColor=ffdfbf" alt="Cat Icon" className="w-16 h-16 ml-8 grayscale" />
          </div>
        </div>

        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl md:text-[6rem] lg:text-[7.5rem] font-heading leading-[0.9] uppercase mb-8">
              Turn <span className="text-pink-500">Books</span> <br />
              Into <span className="text-pink-500">Ideas</span>
            </h1>
            
            <p className="text-lg md:text-xl font-body max-w-2xl mx-auto mb-10 leading-relaxed opacity-80">
              Zizhi helps you make sense of what you read and remember the core concepts long after you’ve turned the last page.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <button 
                onClick={onEnter}
                className="bg-cyan-400 text-black px-10 md:px-14 py-4 md:py-5 border-4 border-black shadow-[6px_6px_0px_black] font-heading text-lg md:text-xl uppercase hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all group"
              >
                Start Reading
              </button>
              <button 
                className="flex items-center gap-2 font-heading text-[12px] uppercase tracking-widest hover:text-pink-500 group transition-colors"
              >
                See how it works <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <img 
                    key={i}
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} 
                    alt="Reader" 
                    className="w-10 h-10 rounded-full border-2 border-black bg-white"
                  />
                ))}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                1200+ readers are already using this
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section: Reading Problem */}
      <section className="py-24 md:py-40 border-t-4 border-black bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-8xl font-heading leading-none uppercase">
              You don't have <br className="hidden lg:block" /> a reading <br className="hidden lg:block" /> problem...
            </h2>
          </div>

          <div className="pt-4 md:pt-12 space-y-8">
            <div className="space-y-1">
              <h3 className="text-xl md:text-3xl font-heading leading-tight mb-6">
                Your best ideas are buried inside books you already read
              </h3>
              <p className="text-lg md:text-xl">
                <span className="text-pink-500">You highlight</span>, <span className="text-yellow-500">You screenshot</span>, <span className="text-cyan-500">you bookmark</span>,<br />
                you tell yourself you'll come back to it.
              </p>
            </div>
            
            <h4 className="text-4xl md:text-6xl font-heading text-pink-500 uppercase rotate-[2deg]">
              You don't!
            </h4>

            {/* Doodle Arrow */}
            <div className="relative py-12 md:py-24">
               <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 400 150">
                 <path 
                    d="M100,20 C150,20 200,80 150,120 C100,160 50,100 80,40 C110,-20 300,100 350,110" 
                    fill="none" 
                    stroke="black" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="animate-[draw_2s_ease-out_forwards]"
                    strokeDasharray="1000"
                    strokeDashoffset="1000"
                 />
                 <path d="M340,100 L355,112 L340,125" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
               </svg>
               <div className="pt-20 pl-20 md:pt-32 md:pl-64">
                  <div className="font-doodle text-2xl md:text-4xl rotate-[-5deg]">
                    Zizhi fixes that!
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Combine */}
      <section className="py-24 bg-[#fbf6e1] border-y-4 border-black">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-bold text-[13px] uppercase tracking-[0.2em] mb-4 opacity-70">Zizhi puts together</p>
          <h2 className="text-4xl md:text-7xl font-heading leading-[0.9] uppercase mb-16 md:mb-24">
            Everything reading apps <br className="hidden md:block" /> forgot to combine
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Need to read a new book?",
                desc: "We've got a beautiful built-in e-reader that you can easily customize to fit your reading preferences",
                color: "bg-yellow-400"
              },
              {
                title: "Need to remember what you read?",
                desc: "Zizhi has a dedicated quoting and notes taking functionality that allows users to highlight the important stuff and revisit them whenever they need to",
                color: "bg-cyan-400"
              },
              {
                title: "Can't remember what you read?",
                desc: "Inside Zizhi there exists a personal AI assistant... 'phoebe' whom is always ready to talk about the things you read. What's more? you can easily generate AI audio summaries that help you grasp the 'big idea'",
                color: "bg-pink-400"
              }
            ].map((card, i) => (
              <div key={i} className={`p-8 border-4 border-black shadow-[8px_8px_0px_black] ${card.color} h-full flex flex-col gap-4 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_black] transition-all`}>
                <h3 className="text-xl md:text-2xl font-heading uppercase leading-tight">{card.title}</h3>
                <p className="text-base font-body leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Compound */}
      <section className="py-24 md:py-40">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-bold text-[13px] uppercase tracking-[0.2em] mb-4 opacity-70 text-center">Zizhi app was built because we believe that....</p>
          <h2 className="text-4xl md:text-[6rem] font-heading leading-[0.9] uppercase text-center mb-20 md:mb-32">
            Reading should <br className="hidden md:block" /> compound
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="p-10 border-2 border-black/10 bg-white/50 backdrop-blur-sm space-y-8">
              <h3 className="text-3xl font-heading uppercase tracking-tighter">Before Zizhi</h3>
              <div className="space-y-6">
                {[
                  { text: "10 unfinished books", emoji: "🙃" },
                  { text: "500 forgotten highlights", emoji: "😶" },
                  { text: "Zero applied insights", emoji: "🙃" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-xl md:text-2xl font-body opacity-60 italic">
                    <span className="text-3xl grayscale opacity-50">{item.emoji}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-10 border-4 border-black bg-[#2eb67d] shadow-[12px_12px_0px_black] space-y-8">
              <h3 className="text-3xl font-heading uppercase tracking-tighter text-white">After Zizhi</h3>
              <div className="space-y-6">
                {[
                  { text: "Build a library that works for you.", emoji: "🙂" },
                  { text: "Retain 10x more of what you read.", emoji: "🙂" },
                  { text: "AI-driven patterns that connect the dots.", emoji: "🙂" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-xl md:text-2xl font-heading tracking-tight text-black">
                    <span className="text-3xl">{item.emoji}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 md:py-48 px-6 text-center">
        <h2 className="text-4xl md:text-[6rem] lg:text-[7rem] font-heading leading-[0.85] uppercase mb-12">
          If you're going to read... <br />
          <span className="text-pink-500">You might as well remember</span>
        </h2>
        
        <button 
          onClick={onEnter}
          className="bg-pink-500 text-white px-12 md:px-20 py-5 md:py-6 border-4 border-black shadow-[8px_8px_0px_black] font-heading text-xl md:text-2xl uppercase hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all mb-20"
        >
          Start Reading
        </button>

        <footer className="text-[11px] font-bold uppercase tracking-[0.2em] flex flex-col md:flex-row items-center justify-center gap-4 opacity-60">
          <div>Built with ❤ and ☕ for all the book lovers out there!</div>
        </footer>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}} />
    </div>
  );
};

export default LandingView;
