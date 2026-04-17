import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Activity, Users, ShieldCheck } from 'lucide-react';
import { Card } from '../components/ui';

const RoleCard = ({ role, title, icon: Icon, description, onClick, colorClass }) => (
  <div 
    onClick={onClick}
    className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2"
  >
    <Card className="h-full border-2 border-transparent hover:border-primary hover:shadow-2xl bg-white p-8 flex flex-col items-center text-center rounded-[32px] transition-all">
      <div className={`w-20 h-20 rounded-3xl ${colorClass} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon size={40} className="text-white" />
      </div>
      <h3 className="text-2xl font-black text-text-primary mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed opacity-80">{description}</p>
      
      <div className="mt-8 px-6 py-2 rounded-full bg-slate-50 text-[11px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Enter Terminal
      </div>
    </Card>
  </div>
);

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
      {/* Brand Header */}
      <div className="mb-16 flex flex-col items-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-primary/20 mb-6">J</div>
        <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-2">JanmaSethu</h1>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
          <ShieldCheck size={14} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Clinical OS Terminal V2.0</span>
        </div>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <RoleCard 
          role="doctor"
          title="Doctor"
          icon={Stethoscope}
          description="Clinical review, AI expert notes, and patient escalation management."
          colorClass="bg-[#0EA5E9]"
          onClick={() => {
            localStorage.setItem('janma_role', 'doctor');
            navigate('/doctor/onboarding');
          }}
        />
        <RoleCard 
          role="nurse"
          title="Nurse"
          icon={Activity}
          description="Clinical triage, monitoring, and specialized clinical workflow."
          colorClass="bg-[#6366F1]"
          onClick={() => {
            localStorage.setItem('janma_role', 'nurse');
            navigate('/cro');
          }}
        />
        <RoleCard 
          role="frontdesk"
          title="Front Desk"
          icon={Users}
          description="Patient registration, scheduling, and administrative operations."
          colorClass="bg-[#10B981]"
          onClick={() => {
            localStorage.setItem('janma_role', 'frontdesk');
            navigate('/frontdesk');
          }}
        />
      </div>

      <p className="mt-20 text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-50">
        Authorized Personnel Only • Secure Session Enabled
      </p>
    </div>
  );
};

export default Login;
