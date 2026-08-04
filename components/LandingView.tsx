import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  BookOpen,
  Notebook,
  Quote,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Logo } from './icons';
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
    <div className="min-h-screen bg-[#FFFDF9] text-[var(--color-primary-text)] selection:bg-[var(--color-primary)] selection:text-white overflow-x-hidden relative font-sans">
      <AnimatePresence>
        {showAuth && (
          <AuthView onClose={() => setShowAuth(false)} onLogin={onLogin} onEnterGuest={onEnter} />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex justify-between items-center border-b-2 border-black/10">
        <Logo />
        
        <button 
          onClick={handleStart}
          className="bg-[#FACC15] text-black border-2 border-black shadow-[3px_3px_0px_black] px-5 py-2 font-serif font-bold text-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none outline-none"
        >
          Start Reading
        </button>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-20 md:pt-28 pb-16 text-center flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 bg-amber-100 border border-black/20 px-3.5 py-1 font-serif text-xs font-bold uppercase tracking-wider text-black">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Active Learning Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display leading-[1.08] tracking-tight text-black">
          The Antiflex reading app.
        </h1>

        <p className="text-xl sm:text-2xl font-serif leading-relaxed text-slate-800 max-w-2xl mx-auto font-medium">
          Most reading apps count books. Zizhi helps you remember them.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm mt-4">
          <button 
            onClick={handleStart}
            className="w-full bg-[var(--color-primary)] text-white border-2 border-black shadow-[4px_4px_0px_black] px-8 py-4 font-serif font-bold text-base transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none outline-none"
          >
            Start Reading Free
          </button>
        </div>
      </section>

      {/* Core Tools Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t-2 border-black/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tool 1 */}
          <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0px_black] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-yellow-300 border-2 border-black flex items-center justify-center mb-6 shadow-[2px_2px_0_black]">
                <BookOpen className="w-6 h-6 text-black" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">01 / E-Reader</span>
              <h3 className="text-2xl font-black text-black mt-1 mb-2">In-Book Marginalia</h3>
              <p className="font-serif text-sm text-slate-700 leading-relaxed">
                Write notes directly in the margins of your EPUBs & PDFs as you read.
              </p>
            </div>
            <ul className="mt-6 pt-4 border-t border-black/10 space-y-2 text-xs font-bold text-slate-800">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Margin annotations</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> AI audio summaries</li>
            </ul>
          </div>

          {/* Tool 2 */}
          <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0px_black] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-cyan-300 border-2 border-black flex items-center justify-center mb-6 shadow-[2px_2px_0_black]">
                <Notebook className="w-6 h-6 text-black" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">02 / Commonplace</span>
              <h3 className="text-2xl font-black text-black mt-1 mb-2">Visual Notebooks</h3>
              <p className="font-serif text-sm text-slate-700 leading-relaxed">
                Sketch concepts, structure study binders, and drop quote stickers on a freeform canvas.
              </p>
            </div>
            <ul className="mt-6 pt-4 border-t border-black/10 space-y-2 text-xs font-bold text-slate-800">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Freeform drawing canvas</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Excerpt stickers</li>
            </ul>
          </div>

          {/* Tool 3 */}
          <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0px_black] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-amber-400 border-2 border-black flex items-center justify-center mb-6 shadow-[2px_2px_0_black]">
                <Quote className="w-6 h-6 text-black" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">03 / Active Recall</span>
              <h3 className="text-2xl font-black text-black mt-1 mb-2">3D Flashcard Review</h3>
              <p className="font-serif text-sm text-slate-700 leading-relaxed">
                Flip through saved quotes on 3D index cards and explore thematic AI search clusters.
              </p>
            </div>
            <ul className="mt-6 pt-4 border-t border-black/10 space-y-2 text-xs font-bold text-slate-800">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Flippable 3D cards</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Semantic theme search</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6 border-t-2 border-black/10">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-black leading-tight">
          Turn your reading into lasting knowledge.
        </h2>
        <div>
          <button 
            onClick={handleStart}
            className="bg-[var(--color-primary)] text-white border-2 border-black shadow-[4px_4px_0px_black] px-8 py-4 font-serif font-bold text-base hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all outline-none"
          >
            Get Started with Zizhi
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-8 border-t-2 border-black/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-serif text-slate-500">
        <Logo />
        <div>Active reading for deep thinkers.</div>
      </footer>
    </div>
  );
};

export default LandingView;




