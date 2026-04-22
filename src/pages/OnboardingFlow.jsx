import { useState } from 'react';
import StepWelcome from '../components/StepWelcome';
import StepListing from '../components/StepListing';
import StepLead from '../components/StepLead';
import StepSuccess from '../components/StepSuccess';

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    role: '',
    listing: { title: '', price: '', location: '' },
    lead: { name: '', contact: '', listing: '' }
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 flex flex-col justify-center sm:px-6 lg:px-8">
      {/* Progress Bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex justify-between items-center px-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step >= i ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'bg-slate-200 text-slate-500'
              }`}>
                {i}
              </div>
              {i < 4 && (
                <div className={`w-16 sm:w-20 h-1 ml-2 transition-colors ${step > i ? 'bg-brand-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && <StepWelcome role={data.role} setRole={(r) => updateData('role', r)} onNext={nextStep} />}
      {step === 2 && <StepListing listing={data.listing} setListing={(l) => updateData('listing', l)} onPrev={prevStep} onNext={nextStep} />}
      {step === 3 && <StepLead lead={data.lead} setLead={(l) => updateData('lead', l)} listings={[data.listing]} onPrev={prevStep} onNext={nextStep} />}
      {step === 4 && <StepSuccess userRole={data.role} />}
    </div>
  );
}
