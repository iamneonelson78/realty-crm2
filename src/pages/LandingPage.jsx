import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ProblemSection from '../components/ProblemSection';
import SolutionSection from '../components/SolutionSection';
import CTASection from '../components/CTASection';
import CalendlyModal from '../components/CalendlyModal';

export default function LandingPage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const prev = root.classList.contains('dark') ? 'dark' : 'light';
    root.classList.remove('dark');
    root.classList.add('light');
    return () => {
      root.classList.remove('light');
      root.classList.add(prev);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-brand-200 selection:text-brand-900">
      <Navbar onBookDemo={() => setIsDemoOpen(true)} />
      
      <main>
        <HeroSection onBookDemo={() => setIsDemoOpen(true)} />
        <ProblemSection />
        <SolutionSection />
        <CTASection onBookDemo={() => setIsDemoOpen(true)} />
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-center">
        <p>&copy; {new Date().getFullYear()} Realty CRM. Built for Philippine real estate agents.</p>
      </footer>

      <CalendlyModal 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
      />
    </div>
  );
}
