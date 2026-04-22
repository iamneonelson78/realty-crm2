import { Kanban, BellRing, PenTool, Layers } from 'lucide-react';

export default function SolutionSection() {
  const features = [
    {
      icon: <Layers className="w-6 h-6 text-brand-600" />,
      title: "Track Every Inquiry",
      desc: "Instantly log entries from Messenger or SMS into a clean, searchable database. Never lose a phone number again."
    },
    {
      icon: <Kanban className="w-6 h-6 text-brand-600" />,
      title: "Visual Deal Pipeline",
      desc: "Move leads from 'Inquiry' to 'Viewing' to 'Closed' by simply dragging them. Always know where your money is."
    },
    {
      icon: <BellRing className="w-6 h-6 text-brand-600" />,
      title: "Follow-Up Reminders",
      desc: "Get notified when it's time to check in with a client or auto-generate a follow-up message to secure the viewing."
    },
    {
      icon: <PenTool className="w-6 h-6 text-brand-600" />,
      title: "Listing Post Generator",
      desc: "Stop typing the same details. Fill in the property info once and generate instantly formatted text for Facebook."
    }
  ];

  return (
    <section id="solution" className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-semibold text-sm mb-6">
              The Reality CRM Difference
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Built for agents, not accountants.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              We built this with a Facebook-first workflow. It features a Messenger-style UI that you already know how to use, stripping away the complex enterprise features you don't need.
            </p>
            
            <div className="space-y-8">
              {features.map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h4>
                    <p className="text-slate-600 dark:text-slate-300">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive visual area */}
          <div className="relative bg-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden">
             {/* Mock Pipeline */}
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-white font-semibold text-xl">Active Pipeline</h3>
             </div>
             
             <div className="grid grid-cols-3 gap-4 h-[400px]">
               {/* Column 1 */}
               <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col gap-3">
                 <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Inquiry (2)</div>
                 <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-sm">
                   <div className="text-sm font-medium text-white">Avida Towers 1BR</div>
                   <div className="text-xs text-slate-400 mt-1">Client: Jose</div>
                 </div>
                 <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-sm">
                   <div className="text-sm font-medium text-white">SMDC Light Studio</div>
                   <div className="text-xs text-slate-400 mt-1">Client: Ana</div>
                 </div>
               </div>

               {/* Column 2 */}
               <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col gap-3">
                 <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Viewing (1)</div>
                 <div className="bg-brand-900/40 border border-brand-500/50 p-3 rounded-lg shadow-sm transform -rotate-1 transition-transform hover:rotate-0">
                   <div className="text-sm font-medium text-blue-100">BGC 2BR Bare</div>
                   <div className="flex justify-between items-center mt-2">
                     <span className="text-xs text-brand-300">Client: Maria</span>
                     <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                   </div>
                 </div>
               </div>

               {/* Column 3 */}
               <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col gap-3">
                 <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Closed (1)</div>
                 <div className="bg-green-900/30 border border-green-700/50 p-3 rounded-lg shadow-sm">
                   <div className="text-sm font-medium text-green-100">Jazz Res 1BR</div>
                   <div className="text-xs text-green-400 mt-1">Earnest Money Paid</div>
                 </div>
               </div>
             </div>
             
             {/* Gradient overlay */}
             <div className="absolute inset-x-0 bottom-0 py-10 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}
