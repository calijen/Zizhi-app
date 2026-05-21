import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowDown,
  CheckCircle2, 
  XCircle,
  Sparkles,
  Layers,
  MousePointer2,
} from 'lucide-react';
import { Logo } from './icons';
import { HandDrawnArrow, ScribbleLine } from './Doodles';
import { Avatar, Text } from '@mantine/core';
import AuthView from './AuthView';

import { auth } from '../firebase';

interface LandingViewProps {
  onEnter: () => void;
  onLogin: (user: any) => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onEnter, onLogin }) => {
  const [showAuth, setShowAuth] = React.useState(false);

  const handleStart = () => {
    if (auth.currentUser) {
      onEnter();
    } else {
      setShowAuth(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-primary-text)] selection:bg-[var(--color-primary)] selection:text-white overflow-x-hidden relative">
      <AnimatePresence>
        {showAuth && (
            <AuthView onClose={() => setShowAuth(false)} onLogin={onLogin} />
        )}
      </AnimatePresence>
      
      {/* Background Texture Overlay - Removed global stardust to satisfy "no stars in last section" or just removed if they don't like it */}
      
      {/* Frame 29 - Hero Section Container */}
      <div className="relative w-full max-w-[1512px] mx-auto min-h-screen border-b border-black/10 flex flex-col items-center pt-8 md:pt-[56px] px-6 md:px-[92px] pb-[56px] gap-12 md:gap-[172px] isolation-isolate">
        {/* Background Fade/Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds.png')] mix-blend-multiply" />

        {/* Navigation / nav_bar */}
        <nav className="w-full h-[78px] flex justify-between items-center z-50">
          <Logo />
          
          <div className="hidden lg:flex gap-8 items-center">
              <a href="#how" className="text-center font-serif text-xl leading-[30px] hover:text-[var(--color-primary)] transition-colors">How it works</a>
              <a href="#phil" className="text-center font-serif text-xl leading-[30px] hover:text-[var(--color-primary)] transition-colors">The philosophy</a>
              <a href="#feat" className="text-center font-serif text-xl leading-[30px] hover:text-[var(--color-primary)] transition-colors">Features</a>
          </div>

          <button 
            onClick={handleStart}
            className="w-auto min-w-[160px] h-[48px] bg-[#FACC15] text-black border-2 border-black shadow-[4px_4px_0px_black] px-6 py-[12px] font-serif font-bold text-base leading-6 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none outline-none whitespace-nowrap"
          >
            Start Reading
          </button>
        </nav>

        {/* hero_content */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative z-10 flex flex-col items-center gap-8 md:gap-[64px] w-full max-w-[1000px]"
        >
          <div className="flex flex-col items-center w-full text-[var(--color-primary-text)]">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] leading-tight md:leading-[88px] font-display tracking-[-0.08em] text-center mb-0 md:whitespace-nowrap">
              Turn <span className="text-[var(--color-primary)] drop-shadow-[4px_4px_0_black]">Books</span> Into <span className="text-[var(--color-primary)] drop-shadow-[4px_4px_0_black]">Ideas!</span>
            </h1>
            
            <p className="text-lg md:text-2xl font-serif leading-relaxed md:leading-[34px] text-center mt-4 md:mt-0 max-w-2xl">
              Zizhi helps you make sense of what you read and remember the core concepts long after you’ve turned the last page.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full">
            <button 
              onClick={handleStart}
              className="w-full md:w-[295px] h-[72px] bg-[var(--color-primary)] text-white border-2 border-black shadow-[4px_4px_0px_black] px-[10px] py-[24px] font-serif font-bold text-base transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none outline-none"
            >
              Start Reading
            </button>
            <button 
              className="w-full md:w-[295px] h-[73.01px] text-[var(--color-primary-text)] px-[10px] py-[24px] font-serif font-bold text-base flex items-center justify-center gap-2 group border-2 border-black shadow-[4px_4px_0px_black] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none bg-transparent"
            >
              See how it works <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Frame 36 - Social Proof */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
              <div className="flex -space-x-4">
                  {[1,2,3,4,5].map(i => (
                      <Avatar key={i} src={`https://i.pravatar.cc/100?u=${i + 20}`} className="border-2 border-black w-10 h-10 md:w-14 md:h-14" />
                  ))}
              </div>
              <Text className="w-auto md:w-[159px] font-serif text-base leading-6 text-[var(--color-primary-text)] text-center md:text-left">1200+ readers are already using this</Text>
          </div>
        </motion.div>

        {/* Scribble Doodle Annotation */}
        <div 
          className="absolute w-[185px] h-[102px] z-30 hidden xl:flex items-center justify-center text-center"
          style={{ left: '82px', top: '743px', transform: 'rotate(-43.56deg)' }}
        >
            <div className="font-hand text-xl leading-[34px] text-black">
                Reading doesn't <br /> have to be boring :-)
            </div>
        </div>
      </div>

      {/* Break Section - Problems (Frame 39) */}
      <section id="how" className="py-20 md:py-32 bg-[var(--color-background)] text-[var(--color-primary-text)] overflow-hidden border-y-2 border-black">
        <div className="max-w-[1416px] mx-auto px-6 md:px-12 flex flex-col lg:flex-row justify-between items-start gap-12 md:gap-[49px]">
          {/* Left: Heading */}
          <div className="w-full lg:w-[696px]">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-display leading-tight md:leading-[88px] tracking-[-0.08em] text-black">
              You don’t have a <br />
              reading problem.
            </h2>
          </div>
          
          {/* Right: Frame 38 */}
          <div className="w-full lg:w-[671px] flex flex-col items-start gap-[16px]">
            <h3 className="w-full font-display text-xl md:text-2xl leading-snug md:leading-[34px] text-[var(--color-primary-text)]">
              Your best ideas are buried inside books you already read.
            </h3>
            <div className="w-full md:w-[390px] font-serif text-lg md:text-xl leading-none text-[var(--color-primary)] flex flex-col items-start gap-4">
              <span className="flex items-center gap-2 italic">You highlight <ArrowDown className="w-4 h-4" /></span>
              <span className="flex items-center gap-2 italic">You screenshot <ArrowDown className="w-4 h-4" /></span>
              <span className="flex items-center gap-2 italic">You bookmark <ArrowDown className="w-4 h-4" /></span>
              <span className="flex items-center gap-2 italic text-left">You tell yourself you’ll come back <ArrowDown className="w-4 h-4" /></span>
              <div className="font-black text-3xl md:text-4xl mt-4 italic">YOU DON’T!</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="feat" className="py-20 md:py-40 px-6 md:px-8 max-w-7xl mx-auto">
        <div className="mb-16 md:mb-24 flex flex-col items-start">
            <p className="font-serif text-lg md:text-xl leading-[30px] mb-4 text-[var(--color-primary)]">Zizhi puts together</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] w-full lg:w-[1000px] font-display leading-tight md:leading-[88px] tracking-tighter">
              Everything Reading Apps <br /> Forgot To Combine
            </h2>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {[
            {
              title: "Need to read a new book?",
              desc: "We've got a beautiful built in e-reader that you can easily customize to fit your reading preferences. PDF & EPUB supported.",
              color: "bg-yellow-400"
            },
            {
              title: "Need to remember what you read?",
              desc: "Zizhi has a dedicated quoting and notes taking functionality that allows users to highlight the important stuff and revisit them.",
              color: "bg-cyan-400"
            },
            {
              title: "Can't remember what you read?",
              desc: "Inside Zizhi there exists a personal AI assistant... 'phoebe' who is always ready to talk about the things you read. Plus AI audio summaries.",
              color: "bg-[var(--color-primary)]",
              textColor: "text-white"
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ translate: "8px 8px", boxShadow: "0 0 0 black" }}
              className={`p-6 md:p-10 border-4 border-black ${item.color} shadow-[12px_12px_0px_black] transition-all flex flex-col h-full`}
            >
              <h3 className={`text-xl font-black mb-6 leading-tight h-14 ${(item as any).textColor || 'text-black'}`}>{item.title}</h3>
              <p className={`font-bold text-sm leading-relaxed mb-auto opacity-90 ${(item as any).textColor || 'text-black'}`}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section id="phil" className="py-20 md:py-40 bg-[var(--color-surface)] border-t-4 border-black border-b-4">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-12 md:mb-16 flex flex-col items-start">
            <p className="font-serif text-lg md:text-xl leading-[30px] mb-4">Zizhi app was built because we believe that....</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-display leading-tight md:leading-[88px] tracking-tighter">Reading Should Compound</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="p-8 md:p-12 border-4 border-black bg-[var(--color-background)] relative">
               <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-10">Before Zizhi</h3>
               <ul className="space-y-4 md:space-y-6">
                 <li className="flex items-center gap-4 font-bold opacity-60 text-base md:text-lg"><span>🙃</span> 10 unfinished books</li>
                 <li className="flex items-center gap-4 font-bold opacity-60 text-base md:text-lg"><span>🙃</span> 500 forgotten highlights</li>
                 <li className="flex items-center gap-4 font-bold opacity-60 text-base md:text-lg"><span>🙃</span> Zero applied insights</li>
               </ul>
            </div>
            <div className="p-8 md:p-12 border-4 border-black bg-emerald-500 shadow-[12px_12px_0px_black] text-white">
               <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-10">After Zizhi</h3>
               <ul className="space-y-4 md:space-y-6">
                 <li className="flex items-center gap-4 font-extrabold text-white text-base md:text-lg"><span>😊</span> Build a library that works for you.</li>
                 <li className="flex items-center gap-4 font-extrabold text-white text-base md:text-lg"><span>😊</span> Retain 10x more of what you read.</li>
                 <li className="flex items-center gap-4 font-extrabold text-white text-base md:text-lg"><span>😊</span> AI-driven patterns that connect the dots.</li>
               </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-40 bg-[var(--color-background)] text-[var(--color-primary-text)] text-center px-6 md:px-8 relative overflow-hidden border-t-4 border-black">
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-display leading-tight tracking-tighter">
            If You’re Going To Read... <br />
            <span className="text-[var(--color-primary)] drop-shadow-[4px_4px_0_black]">You Might As Well Remember</span>
          </h2>
          <button 
             onClick={handleStart}
             className="w-full md:w-auto bg-[var(--color-primary)] text-white px-8 md:px-16 py-6 md:py-8 border-4 border-black shadow-[12px_12px_0px_black] font-black text-xl md:text-2xl hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all outline-none focus-visible:ring-4 focus-visible:ring-cyan-500"
          >
            Start Reading
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-20 px-6 md:px-8 border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12 bg-[var(--color-background)]">
        <Logo />
        <div className="text-black font-black tracking-widest text-[10px] opacity-40 text-center md:text-left">
          Built with ❤️ and ☕ for all the book lovers out there!
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
