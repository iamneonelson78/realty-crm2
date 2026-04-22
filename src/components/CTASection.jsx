import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export default function CTASection({ onBookDemo }) {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-900 z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[128px] opacity-60 transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[128px] opacity-60 transform -translate-x-1/3 translate-y-1/3"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Ready to professionalize your real estate business?
        </h2>
        <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
          Join top-performing Philippine agents who are organizing their pipeline and closing more deals faster.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center gap-2 min-w-[160px] px-8 py-4 rounded-full bg-white text-brand-900 font-bold hover:bg-slate-50 shadow-xl transition-all transform hover:-translate-y-1">
            Start Free <ArrowRight className="w-5 h-5" />
          </Link>
          <button onClick={onBookDemo} className="w-full sm:w-auto flex items-center justify-center gap-2 min-w-[160px] px-8 py-4 rounded-full bg-transparent border-2 border-brand-400 text-white font-bold hover:bg-brand-800 transition-all">
            Book Demo <Play className="w-5 h-5 fill-current" />
          </button>
        </div>
        
        <div className="mt-8 text-brand-300 text-sm">
          Already have an account? <Link to="/login" className="text-white font-medium hover:underline">Log in</Link>
        </div>
      </div>
    </section>
  );
}
