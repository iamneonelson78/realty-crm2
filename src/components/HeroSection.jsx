import { ArrowRight, Play, CheckCircle2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection({ onBookDemo }) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-brand-50 dark:bg-brand-950/30 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-50 dark:bg-blue-950/30 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Main content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 text-brand-700 dark:text-brand-400 text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-brand-500"></span>
              Built exclusively for Philippine Real Estate Agents
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
              Close More Rental Deals Without Losing Leads in <span className="text-brand-600">Messenger</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0">
              Manage listings, organize inquiries, and automate follow-ups in one simple system designed to replace your chaotic Facebook workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center gap-2 min-w-[160px] px-6 py-3.5 rounded-full bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-1">
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={onBookDemo} className="w-full sm:w-auto flex items-center justify-center gap-2 min-w-[160px] px-6 py-3.5 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:border-brand-200 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all">
                Book a Demo <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" />
                <span>Set up in 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Visual Device Mockup */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative rounded-2xl glass p-2 border border-slate-200/50 shadow-2xl transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                {/* Mock UI Header */}
                <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between">
                  <div className="font-semibold text-slate-800 dark:text-white">Recent Inquiries</div>
                  <div className="text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded-full">3 New</div>
                </div>
                {/* Mock UI Body */}
                <div className="p-4 space-y-3">
                  {[
                    { name: 'Maria Santos', msg: 'Is the 2BR in BGC still available?', time: '2m ago', active: true },
                    { name: 'Juan Dela Cruz', msg: 'Can we schedule a viewing tomorrow?', time: '1h ago', active: false },
                    { name: 'Elena Reyes', msg: 'I have attached my requirements.', time: '3h ago', active: false },
                  ].map((lead, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${lead.active ? 'bg-white dark:bg-slate-700 border-brand-200 dark:border-brand-700 shadow-sm' : 'bg-transparent border-slate-200 dark:border-slate-700'}`}>
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex-shrink-0 flex items-center justify-center text-slate-500 dark:text-slate-300 font-semibold">
                        {lead.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{lead.name}</h4>
                          <span className="text-xs text-slate-400">{lead.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5"><MessageCircle className="inline w-3 h-3 mr-1" />{lead.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating Element */}
            <div className="absolute -left-8 top-12 glass p-4 rounded-xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">Viewing Set</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Maria Santos - BGC 2BR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
