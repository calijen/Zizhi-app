import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  ChevronDown, 
  ArrowRight, 
  Brain, 
  Lock, 
  Star, 
  Zap, 
  Feather, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Logo } from './icons';
import AuthView from './AuthView';
import { auth } from '../firebase';

interface LandingViewProps {
  onEnter: () => void;
  onLogin: (user: any) => void;
}

const FAQ_ITEMS = [
  {
    question: "Is Zizhi local-first and private?",
    answer: "Yes! Your uploaded EPUBs, PDFs, highlights, side notes, and notebooks are stored locally in your browser's IndexedDB engine. Signing in syncs your quotes and notes to Firebase securely."
  },
  {
    question: "What book formats are supported?",
    answer: "Zizhi supports native EPUB and PDF file uploads. You can read with custom serif and sans-serif fonts, adjustable line spacing, sepia or dark themes, and full text rendering."
  },
  {
    question: "How does the Zizhi AI Librarian work?",
    answer: "Zizhi connects to Gemini 3.6 Flash via a secure server-side API proxy. It reads your saved highlights to answer questions, discover cross-book themes, filter quotes semantically, and generate 800-word audio summaries."
  },
  {
    question: "Can I export my highlights and quote cards?",
    answer: "Absolutely. You can generate custom visual quote cards in multiple aesthetic presets and aspect ratios to download as high-resolution PNGs for sharing."
  },
  {
    question: "Do I need to create an account to start reading?",
    answer: "Yes, simply sign in or create a free account to start reading, taking notes, and saving your library."
  }
];

const TESTIMONIALS = [
  {
    quote: "Zizhi completely changed how I prepare lecture notes. Having my side notes, quote collections, and AI library chat in one local-first tool is revolutionary.",
    author: "Dr. Aris Thorne",
    role: "Professor of Literature & History",
    tag: "Verified Scholar",
    bg: "bg-[#FFF9C4]"
  },
  {
    quote: "The 3D flashcard recall system and quote export feature make sharing insights on Substack so aesthetic and seamless. Finally, an app that values deep reading over streaks.",
    author: "Maya Lin",
    role: "Independent Essayist & Researcher",
    tag: "Active Reader",
    bg: "bg-[#E0F7FA]"
  },
  {
    quote: "Most reading trackers just want me to finish 50 books a year. Zizhi actually helps me synthesize concepts across Nietzsche, McLuhan, and Harari.",
    author: "Samuel Vance",
    role: "Philosophy Student & Writer",
    tag: "Power User",
    bg: "bg-[#F5E6D3]"
  }
];

const LandingView: React.FC<LandingViewProps> = ({ onEnter, onLogin }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleStart = () => {
    if (auth.currentUser) {
      onEnter();
    } else {
      setShowAuth(true);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1A1A1A] selection:bg-[#FFCC00] selection:text-black overflow-x-hidden relative font-sans">
      <AnimatePresence>
        {showAuth && (
          <AuthView 
            onClose={() => setShowAuth(false)} 
            onLogin={(user) => {
              onLogin(user);
              onEnter();
            }} 
          />
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#FAF7F0]/95 backdrop-blur-md w-full border-b-3 sm:border-b-4 border-black px-4 sm:px-8 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <Logo />

          <nav className="hidden md:flex items-center gap-6 text-xs font-black uppercase tracking-wider">
            <button onClick={() => scrollToSection('features')} className="hover:text-[#D97706] transition-colors">Features</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-[#D97706] transition-colors">About</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-[#D97706] transition-colors">Reviews</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#D97706] transition-colors">FAQ</button>
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={handleStart}
              className="bg-[#FFCC00] text-black border-2 border-black shadow-[3px_3px_0_black] hover:bg-[#FFE055] active:translate-x-[1px] active:translate-y-[1px] px-5 sm:px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all"
            >
              Start Reading
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12 md:pt-16 pb-12 sm:pb-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Hero Left Column */}
          <div className="lg:col-span-6 flex flex-col items-start gap-5 sm:gap-6">
            <div className="inline-block bg-[#1A1A1A] text-[#FFCC00] font-black text-xs uppercase tracking-[0.2em] px-3.5 py-1.5 border-2 border-black shadow-[2px_2px_0_black]">
              THE ANTIFLEX READING APP
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl max-w-xl font-black uppercase tracking-tight leading-[1.05] text-black italic">
              MOST READING APPS COUNT BOOKS.
            </h1>

            <div className="border-t-3 sm:border-t-4 border-black w-20 sm:w-24 my-0.5" />

            <h2 className="text-2xl sm:text-4xl lg:text-4xl font-serif font-black italic text-[#8B4513] leading-snug">
              ZIZHI HELPS YOU LEARN FROM THEM.
            </h2>

            {/* Feature Indicator Cards */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="p-2.5 sm:p-3 border-2 border-black bg-white shadow-[2px_2px_0_black] flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#FFCC00] border border-black flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">READ</span>
              </div>

              <div className="p-2.5 sm:p-3 border-2 border-black bg-white shadow-[2px_2px_0_black] flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#00E5FF] border border-black flex items-center justify-center shrink-0">
                  <Feather className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">TAKE NOTES</span>
              </div>

              <div className="p-2.5 sm:p-3 border-2 border-black bg-white shadow-[2px_2px_0_black] flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#FFCC00] border border-black flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">REMEMBER</span>
              </div>

              <div className="p-2.5 sm:p-3 border-2 border-black bg-white shadow-[2px_2px_0_black] flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#00E5FF] border border-black flex items-center justify-center shrink-0">
                  <Search className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">ASK ZIZHI</span>
              </div>
            </div>

            {/* Single Action Button */}
            <div className="w-full pt-2 sm:pt-4">
              <button 
                onClick={handleStart}
                className="w-full sm:w-auto bg-[#FFCC00] text-black border-3 sm:border-4 border-black shadow-[4px_4px_0_black] sm:shadow-[6px_6px_0_black] hover:bg-[#FFE055] active:translate-x-[2px] active:translate-y-[2px] py-4 px-8 sm:px-10 font-black uppercase tracking-widest text-xs sm:text-base flex items-center justify-center gap-3 transition-all min-h-[52px]"
              >
                <span>Start Reading</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hero Right Column */}
          <div className="lg:col-span-6 relative flex justify-center items-center py-4 sm:py-6">
            <div className="relative w-full max-w-md sm:max-w-lg bg-[#00E5FF] border-3 sm:border-4 border-black shadow-[8px_8px_0_black] sm:shadow-[12px_12px_0_black] p-4 sm:p-6 flex flex-col justify-between overflow-hidden min-h-[280px] sm:min-h-[340px]">
              <div className="absolute inset-0 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

              <div className="relative bg-[#FFFDF5] border-2 sm:border-3 border-black p-4 sm:p-5 shadow-[4px_4px_0_black] sm:shadow-[6px_6px_0_black] w-[90%] sm:w-[88%] z-10 font-serif">
                <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-black/50 mb-2 border-b border-black/10 pb-1">
                  CHAPTER IV: THE HORIZON
                </div>

                <div className="text-xl sm:text-2xl font-black text-black mb-1">“</div>
                
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-black/90 mb-2.5 bg-[#FFCC00] p-2 border-l-3 border-black">
                  This seems promising. The good news is that you no longer have to wave the flashlight in the air; all you need do is point and click.
                </p>

                <p className="text-[11px] sm:text-xs text-black/70 leading-relaxed font-serif">
                  The bad news is that one of the first messages you try to send turns out to require 131 blinks of light!
                </p>
              </div>

              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-[58%] sm:w-[52%] bg-white border-2 sm:border-3 border-black p-3 shadow-[4px_4px_0_black] sm:shadow-[6px_6px_0_black] z-20 font-sans transform rotate-2">
                <div className="flex items-center justify-between border-b border-black pb-1 mb-1.5">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">NOTEBOOK</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-black" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 border border-black" />
                  </div>
                </div>

                <p className="font-serif italic text-[11px] sm:text-xs text-black/80 leading-snug mb-1.5">
                  How communication changes when tech changes.
                </p>

                <div className="bg-[#FFF9C4] border border-black p-1.5 text-[9px] sm:text-[10px] font-sans font-bold text-black shadow-[1px_1px_0_black]">
                  Reminds me of Marshall McLuhan: "The medium is the message."
                </div>
              </div>

              <div className="absolute -bottom-1 right-2 sm:bottom-2 sm:right-3 bg-[#FFCC00] border-2 sm:border-3 border-black p-2.5 sm:p-3 shadow-[4px_4px_0_black] sm:shadow-[6px_6px_0_black] z-30 max-w-[200px] sm:max-w-[240px]">
                <div className="flex items-center justify-between border-b border-black pb-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-black text-white flex items-center justify-center font-black text-[9px]">Z</div>
                    <span className="text-[9px] font-black uppercase tracking-wider">ZIZHI AI LIBRARIAN</span>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs font-black text-black">
                  What ideas keep coming up in my books?
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION BREAK STRIP */}
      <div className="bg-black text-white py-3 sm:py-4 border-y-3 sm:border-y-4 border-black overflow-hidden select-none">
        <div className="flex whitespace-nowrap animate-marquee gap-8 text-[11px] sm:text-xs font-black uppercase tracking-[0.2em]">
          <span>★ LOCAL-FIRST E-READER</span>
          <span>★ SIDE-MARGIN NOTES</span>
          <span>★ 3D FLASHCARD RECALL</span>
          <span>★ GEMINI AI LIBRARIAN</span>
          <span>★ LOCAL-FIRST E-READER</span>
          <span>★ SIDE-MARGIN NOTES</span>
          <span>★ 3D FLASHCARD RECALL</span>
          <span>★ GEMINI AI LIBRARIAN</span>
        </div>
      </div>

      {/* PRODUCT FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3 sm:space-y-4">
          <div className="inline-block bg-[#00E5FF] text-black font-black text-xs uppercase tracking-[0.2em] px-3 py-1 border-2 border-black shadow-[2px_2px_0_black]">
            THREE CORE ENGINES
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight italic">
            BUILT FOR ACTIVE LEARNERS
          </h2>
          <p className="font-serif text-base sm:text-lg text-black/80">
            Everything you need to turn temporary reading into a lifetime of organized, synthesized wisdom.
          </p>
        </div>

        <div className="space-y-12 sm:space-y-16">
          {/* Feature 1 */}
          <div className="bg-white border-3 sm:border-4 border-black p-5 sm:p-8 lg:p-10 shadow-[6px_6px_0_black] sm:shadow-[10px_10px_0_black] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#FFCC00] border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_black]">
                <BookOpen className="w-4 h-4 text-black" />
                <span>01 / E-Reader & Side Notes</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
                Read Without Passive Skimming
              </h3>
              <p className="font-serif text-sm sm:text-base text-black/80 leading-relaxed">
                Upload your EPUBs and PDFs into a high-performance, clutter-free reader. Highlight passages in custom colors and type side notes as your thoughts arise.
              </p>
              <ul className="space-y-2 text-xs font-black uppercase tracking-wider text-black/80 pt-1">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B4513]" /> Side-margin annotation panel
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B4513]" /> Custom serif & sans font typography
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B4513]" /> AI-generated 800-word audio summaries
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 bg-[#FAF7F0] border-2 sm:border-3 border-black p-5 sm:p-6 shadow-[4px_4px_0_black] sm:shadow-[6px_6px_0_black] font-serif space-y-4">
              <div className="flex justify-between items-center border-b-2 border-black pb-2 text-xs font-sans font-bold uppercase text-black/60">
                <span>READER PREVIEW</span>
                <span>SEPIA THEME</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-black/90">
                “To live is to suffer, to survive is to find some meaning in the suffering.”
              </p>
              <div className="bg-[#FFCC00] border-2 border-black p-3 text-xs font-sans font-bold text-black shadow-[3px_3px_0_black]">
                Side note: Core thesis of Frankl's logotherapy.
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border-3 sm:border-4 border-black p-5 sm:p-8 lg:p-10 shadow-[6px_6px_0_black] sm:shadow-[10px_10px_0_black] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#00E5FF] border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_black]">
                <Layers className="w-4 h-4 text-black" />
                <span>02 / Active Recall & Cards</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
                Retain Key Insights Forever
              </h3>
              <p className="font-serif text-sm sm:text-base text-black/80 leading-relaxed">
                Flip through saved highlights on tactile 3D index cards. Filter quotes semantically using Gemini AI to review concepts by author, book, or philosophical domain.
              </p>
              <ul className="space-y-2 text-xs font-black uppercase tracking-wider text-black/80 pt-1">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FFCC00]" /> Flippable 3D card physics
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FFCC00]" /> Semantic AI topic filtering
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FFCC00]" /> High-resolution exportable share cards
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 bg-[#FAF7F0] border-2 sm:border-3 border-black p-5 sm:p-6 shadow-[4px_4px_0_black] sm:shadow-[6px_6px_0_black] font-serif space-y-3 text-center">
              <div className="bg-white border-2 sm:border-3 border-black p-5 sm:p-6 shadow-[3px_3px_0_black] sm:shadow-[4px_4px_0_black] relative">
                <span className="text-[10px] font-sans font-black uppercase text-black/50 block mb-2">3D FLASHCARD PREVIEW</span>
                <p className="text-xs sm:text-sm italic font-medium">“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”</p>
                <div className="mt-4 pt-3 border-t border-black/10 flex justify-between items-center text-[11px] font-sans font-bold text-black/70">
                  <span>Aristotle</span>
                  <span>Nicomachean Ethics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border-3 sm:border-4 border-black p-5 sm:p-8 lg:p-10 shadow-[6px_6px_0_black] sm:shadow-[10px_10px_0_black] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 bg-[#FAF7F0] border-2 sm:border-3 border-black p-5 sm:p-6 shadow-[4px_4px_0_black] sm:shadow-[6px_6px_0_black] font-sans space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2 text-xs font-black uppercase">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>CHAT WITH ZIZHI</span>
              </div>
              <div className="bg-white border-2 border-black p-3 text-xs shadow-[2px_2px_0_black]">
                <strong className="block text-[10px] text-black/60 uppercase">YOU:</strong>
                How do Nietzsche and Marcus Aurelius view suffering differently?
              </div>
              <div className="bg-[#FFF9C4] border-2 border-black p-3 text-xs shadow-[2px_2px_0_black]">
                <strong className="block text-[10px] text-black/60 uppercase">ZIZHI AI:</strong>
                Based on your saved quotes, Aurelius sees suffering as an obstacle to be endured with stoic reason, whereas Nietzsche embraces suffering as a vital force for self-overcoming...
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#FFCC00] border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_black]">
                <Search className="w-4 h-4 text-black" />
                <span>03 / AI Librarian & Synthesizer</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight">
                Conversational Library Intelligence
              </h3>
              <p className="font-serif text-sm sm:text-base text-black/80 leading-relaxed">
                Chat directly with Zizhi—an AI librarian trained on your highlights. Discover hidden themes across different authors, generate audio summaries, and receive personalized book recommendations.
              </p>
              <ul className="space-y-2 text-xs font-black uppercase tracking-wider text-black/80 pt-1">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B4513]" /> Cross-book concept synthesis
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B4513]" /> Personalized scholarly reading recommendations
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B4513]" /> Server-side API key protection
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="bg-[#1A1A1A] text-white py-16 sm:py-20 border-y-4 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10 sm:space-y-12">
          
          <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
            <div className="inline-block bg-[#FFCC00] text-black font-black text-xs uppercase tracking-[0.2em] px-3.5 py-1.5 border-2 border-white shadow-[2px_2px_0_white]">
              OUR MANIFESTO
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white italic">
              AGAINST THE READING FLEX
            </h2>
          </div>

          <div className="bg-[#262626] border-3 sm:border-4 border-white p-6 sm:p-10 shadow-[8px_8px_0_#FFCC00] sm:shadow-[12px_12px_0_#FFCC00] font-serif space-y-5 text-sm sm:text-lg text-white/90 leading-relaxed">
            <p>
              In modern digital culture, reading is often treated as a vanity metric—how many books you finished this year on Goodreads or StoryGraph, or how many spines sit on your shelf.
            </p>
            <p className="text-[#FFCC00] font-bold italic">
              But skimming 50 books without retaining a single concept is an illusion of learning.
            </p>
            <p>
              Zizhi was built for active thinkers, scholars, researchers, and lifelong learners who care about <strong className="text-white underline">retention, side notes, and synthesis</strong>. Your personal reading collection should function as a living second brain, not just a list of checked boxes.
            </p>
          </div>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-[#262626] border-2 border-white p-5 sm:p-6 shadow-[4px_4px_0_white]">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FFCC00] text-black border border-white flex items-center justify-center font-black mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-black uppercase text-xs sm:text-sm mb-2 text-white">Local-First Engine</h4>
              <p className="font-serif text-xs text-white/70 leading-relaxed">
                Your books and notes live inside your browser's IndexedDB storage. You own your knowledge.
              </p>
            </div>

            <div className="bg-[#262626] border-2 border-white p-5 sm:p-6 shadow-[4px_4px_0_white]">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#00E5FF] text-black border border-white flex items-center justify-center font-black mb-3">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="font-black uppercase text-xs sm:text-sm mb-2 text-white">Active Recall</h4>
              <p className="font-serif text-xs text-white/70 leading-relaxed">
                Turn passive highlights into interactive 3D flashcard decks and structured notebook cards.
              </p>
            </div>

            <div className="bg-[#262626] border-2 border-white p-5 sm:p-6 shadow-[4px_4px_0_white]">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FFCC00] text-black border border-white flex items-center justify-center font-black mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-black uppercase text-xs sm:text-sm mb-2 text-white">Zero Exposure AI</h4>
              <p className="font-serif text-xs text-white/70 leading-relaxed">
                Server-side proxied Gemini models analyze your library without exposing API keys or tracking data.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3 sm:space-y-4">
          <div className="inline-block bg-[#FFCC00] text-black font-black text-xs uppercase tracking-[0.2em] px-3 py-1 border-2 border-black shadow-[2px_2px_0_black]">
            COMMUNITY FEEDBACK
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight italic">
            WHAT READERS ARE SAYING
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((t, index) => (
            <div 
              key={index}
              className={`p-6 sm:p-8 border-3 sm:border-4 border-black shadow-[6px_6px_0_black] sm:shadow-[8px_8px_0_black] flex flex-col justify-between ${t.bg}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-600 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-black" />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white border border-black px-2 py-0.5">
                    {t.tag}
                  </span>
                </div>
                <p className="font-serif text-xs sm:text-sm leading-relaxed text-black/90 italic">
                  “{t.quote}”
                </p>
              </div>

              <div className="mt-6 sm:mt-8 pt-3 border-t-2 border-black/20">
                <div className="font-black uppercase text-xs text-black">{t.author}</div>
                <div className="text-[11px] font-serif font-bold text-black/60">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="bg-[#FAF7F0] py-16 sm:py-20 border-t-3 sm:border-t-4 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-10 sm:space-y-12">
          
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="inline-block bg-[#00E5FF] text-black font-black text-xs uppercase tracking-[0.2em] px-3 py-1 border-2 border-black shadow-[2px_2px_0_black]">
              QUESTIONS & ANSWERS
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight italic">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white border-2 sm:border-3 border-black shadow-[3px_3px_0_black] sm:shadow-[4px_4px_0_black] overflow-hidden transition-all"
                >
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex justify-between items-center gap-3 hover:bg-amber-50 transition-colors"
                  >
                    <span className="font-black uppercase text-xs sm:text-base text-black">
                      {item.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 text-black shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t-2 border-black/10 font-serif text-xs sm:text-sm text-black/80 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION (CTA) */}
      <section className="bg-[#FFCC00] border-t-3 sm:border-t-4 border-black py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none italic text-black">
            READY TO TURN READING INTO LASTING KNOWLEDGE?
          </h2>

          <p className="font-serif text-base sm:text-xl font-bold text-black/85 max-w-2xl mx-auto">
            No paywalls, no tracking, no reading streak pressure. Start building your second brain today.
          </p>

          <div className="flex justify-center items-center pt-2 sm:pt-4">
            <button 
              onClick={handleStart}
              className="bg-[#1A1A1A] text-[#FFCC00] border-3 sm:border-4 border-black shadow-[4px_4px_0_black] sm:shadow-[6px_6px_0_black] hover:bg-black active:translate-x-[2px] active:translate-y-[2px] py-4 px-10 font-black uppercase tracking-widest text-xs sm:text-base transition-all min-h-[52px]"
            >
              Start Reading
            </button>
          </div>
        </div>
      </section>

      {/* SIMPLE FOOTER */}
      <footer className="bg-[#1A1A1A] text-white border-t-3 sm:border-t-4 border-black py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <span className="text-xs font-serif text-white/60">Active reading & note-taking engine for deep thinkers.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs font-black uppercase tracking-wider text-white/80">
            <button onClick={() => scrollToSection('features')} className="hover:text-[#FFCC00] transition-colors">Features</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-[#FFCC00] transition-colors">About</button>
            <button onClick={() => scrollToSection('testimonials')} className="hover:text-[#FFCC00] transition-colors">Reviews</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#FFCC00] transition-colors">FAQ</button>
            <button onClick={handleStart} className="hover:text-[#FFCC00] transition-colors">Start Reading</button>
          </div>

          <div className="text-[11px] font-mono text-white/50">
            © {new Date().getFullYear()} Zizhi Engine. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
