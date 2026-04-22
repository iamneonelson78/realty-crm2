import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

export default function Navbar({ onBookDemo }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Logo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Realty <span className="text-brand-600 dark:text-brand-400">CRM</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#problem" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">Why Us</a>
            <a href="#solution" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">Features</a>
            <div className="flex items-center space-x-4">
              <button onClick={onBookDemo} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Book a Demo</button>
              <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Login</Link>
              <Link to="/signup" className="text-sm font-medium bg-brand-600 text-white px-5 py-2.5 rounded-full hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all transform hover:-translate-y-0.5">
                Start Free
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 dark:text-slate-300">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass absolute top-full left-0 w-full border-t border-slate-100 dark:border-slate-800 p-4 flex flex-col space-y-4 animate-in slide-in-from-top-2">
          <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Why Us</a>
          <a href="#solution" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Features</a>
          <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Login</Link>
          <button onClick={() => { onBookDemo(); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Book a Demo</button>
          <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 bg-brand-600 text-white text-center font-medium rounded-full">Start Free</Link>
        </div>
      )}
    </nav>
  );
}
