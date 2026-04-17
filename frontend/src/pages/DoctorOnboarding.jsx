import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  CheckCircle2, 
  Monitor, 
  Brain, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui';

const BenefitItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg group">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
      <Icon size={18} />
    </div>
    <p className="text-sm font-semibold text-text-primary leading-tight">{text}</p>
  </div>
);

const DoctorOnboarding = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: Monitor, text: "24/7 Continuous Patient Monitoring" },
    { icon: Brain, text: "Instant AI-Powered Symptom Triage" },
    { icon: CheckCircle2, text: "Automated Clinical Documentation" },
    { icon: Zap, text: "Real-time Lab & Vitals Alerts" },
    { icon: Clock, text: "Significant Reduction in Daily Burnout" }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-3xl w-full flex flex-col items-center text-center">
        {/* Animated Icon Header */}
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 animate-bounce">
          <Brain size={32} />
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-black text-text-primary tracking-tighter mb-3 leading-tight">
          YOUR <span className="text-primary italic">TWIN</span>
        </h1>

        {/* Description */}
        <p className="text-base text-text-secondary leading-relaxed mb-8 max-w-2xl font-medium opacity-90">
          Meet your digital clinical extension. The JanmaSethu Twin is an advanced AI designed to capture the essence of your expertise, handling routine triage and monitoring so you can focus on what matters most—critical patient care.
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mb-8 text-left">
          {benefits.map((benefit, i) => (
            <BenefitItem key={i} {...benefit} />
          ))}
        </div>

        {/* Key CTA */}
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <Button 
            className="w-full py-4 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 flex justify-center items-center gap-3 transition-transform active:scale-95"
            onClick={() => navigate('/doctor')}
          >
            Enable Digital Twin
            <ArrowRight size={20} />
          </Button>

          <button 
            onClick={() => navigate('/doctor')}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors py-1"
          >
            Skip for now
          </button>
        </div>

        {/* Trust Footer */}
        <div className="mt-8 flex flex-col items-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em] opacity-40">
            JanmaSethu Clinical Engine • Secure AI Terminal
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorOnboarding;
