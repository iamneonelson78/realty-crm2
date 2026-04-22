import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function CalendlyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10">
          <h3 className="font-semibold text-lg text-slate-800">Book a Demo</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 bg-slate-50 relative">
          <iframe 
            src="https://calendly.com/your-link?hide_gdpr_banner=1" 
            width="100%" 
            height="100%" 
            frameBorder="0"
            className="w-full h-full absolute inset-0"
            title="Book a demonstration of Realty CRM"
          />
        </div>
      </div>
    </div>
  );
}
