import { Frown, XCircle, AlertCircle } from 'lucide-react';

export default function ProblemSection() {
  const problems = [
    {
      icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
      title: "Posting on Facebook daily is exhausting",
      desc: "Spending hours bumping listings in Facebook groups just to get a few inquiries."
    },
    {
      icon: <XCircle className="w-6 h-6 text-red-500" />,
      title: "Leads buried in Messenger",
      desc: "Scrolling through chats from friends, family, and group chats just to find that one serious renter."
    },
    {
      icon: <Frown className="w-6 h-6 text-slate-500" />,
      title: "Missed follow-ups = Lost commission",
      desc: "Forgetting to text back a lead, or failing to follow up after a viewing because you lost track manually tracking it."
    }
  ];

  return (
    <section id="problem" className="py-24 bg-slate-50 dark:bg-slate-900 relative border-y border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            The old way is costing you deals.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            You're an agent, not a full-time social media manager. Managing everything through chat and memory simply doesn't scale.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center mb-6">
                {problem.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{problem.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {problem.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
