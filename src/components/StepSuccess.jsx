import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';

export default function StepSuccess({ userRole }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => setShowConfetti(false), 5000); // stop confetti after 5 secs
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in zoom-in-95 duration-500">
      {showConfetti && <Confetti width={windowDimension.width} height={windowDimension.height} recycle={false} numberOfPieces={300} />}
      
      <div className="bg-white py-12 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-400 rounded-full blur-[50px] opacity-50"></div>
        
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-4 relative z-10">You're all set!</h2>
        <p className="text-lg text-slate-600 mb-8 relative z-10">
          Your pipeline is ready. It's time to start organizing your inquiries and closing more deals as a <span className="font-semibold text-brand-600">{userRole}</span>.
        </p>

        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/20 text-base font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none transition-all transform hover:-translate-y-1 relative z-10"
        >
          Go to Dashboard <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
