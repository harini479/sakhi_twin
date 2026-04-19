import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Activity, Users, ShieldCheck, Mail, Lock, KeyRound } from 'lucide-react';
import { Card } from '../components/ui';

const RoleCard = ({ title, icon: Icon, colorClass, onClick }) => (
  <div 
    onClick={onClick}
    className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-1"
  >
    <Card className="h-full border border-gray-200 hover:border-primary hover:shadow-lg bg-white p-4 flex flex-col items-center text-center rounded-2xl transition-all">
      <div className={`w-12 h-12 rounded-xl border ${colorClass} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <h3 className="text-sm font-bold text-text-primary tracking-tight">{title}</h3>
    </Card>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleDemoFill = (role) => {
    setEmail(`${role}@janmasethu.com`);
    setPassword('demo-password-123');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.startsWith('doctor')) {
      sessionStorage.setItem('janma_role', 'doctor');
      navigate('/doctor/onboarding');
    } else if (email.startsWith('nurse')) {
      sessionStorage.setItem('janma_role', 'nurse');
      navigate('/cro');
    } else if (email.startsWith('cro')) {
      sessionStorage.setItem('janma_role', 'frontdesk');
      navigate('/frontdesk');
    } else {
      // Default fallback
      sessionStorage.setItem('janma_role', 'doctor');
      navigate('/doctor/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-primary/20 mb-6">J</div>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter mb-2">JanmaSethu</h1>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Clinical OS Terminal V2.0</span>
          </div>
        </div>

        <Card className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3.5 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Enter your clinical email"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3.5 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Enter your secure password"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-sm py-4 rounded-xl shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <KeyRound size={18} />
              Secure Login
            </button>
          </form>
        </Card>

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Demo Quick Access</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <RoleCard 
              title="Doctor"
              icon={Stethoscope}
              colorClass="bg-[#0EA5E9]"
              onClick={() => handleDemoFill('doctor')}
            />
            <RoleCard 
              title="Nurse"
              icon={Activity}
              colorClass="bg-[#6366F1]"
              onClick={() => handleDemoFill('nurse')}
            />
            <RoleCard 
              title="CRO"
              icon={Users}
              colorClass="bg-[#10B981]"
              onClick={() => handleDemoFill('cro')}
            />
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-50">
          Authorized Personnel Only • Encrypted Session
        </p>
      </div>
    </div>
  );
};

export default Login;
