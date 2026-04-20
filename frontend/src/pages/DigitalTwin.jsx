import { useState } from 'react';
import { Activity, BrainCircuit, ShieldCheck, Zap, Heart, Server, Globe, Cpu, Clock, Terminal, RotateCcw, Play, Sparkles, CheckCircle2 } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import PersonaWizard from './PersonaWizard';

export default function DigitalTwin() {
  const { state } = useDemo();
  const [isTraining, setIsTraining] = useState(false);

  const [showPrompt, setShowPrompt] = useState(false);

  // If we are trained, we show the dashboard. If not, we show the onboarding or the wizard.
  const displayMode = state.isTrained ? (isTraining ? 'wizard' : 'dashboard') : (isTraining ? 'wizard' : 'onboarding');

  const generatedPrompt = `SYSTEM ROLE: SARAH (AGENTIC RECRUITER v4.2)
DNA SOURCE: ${state.user?.name || 'Authorized Recruiter'}
STATUS: Persona Frame Active

[CORE EVALUATION LOGIC]
- Initial Touchpoint: ${state.personaAnswers.q3 || 'Standard outbound'}
- 60-Sec Resume Scan: ${state.personaAnswers.q5 || 'Experience & Skill Density'}
- Tiebreaker Logic: ${state.personaAnswers.q10 || 'Cultural and technical equilibrium'}

[VOICE & TONE]
- Interaction Energy: ${state.personaAnswers.q7 || 'Professional & Efficient'}
- Key Phrases: ${state.personaAnswers.q8 || 'Standard recruitment nomenclature'}

[DISQUALIFICATION HEURISTICS]
- Hard Red Flags: ${state.personaAnswers.q13 || 'Inconsistent tenure, lack of core tech depth'}

[NEGOTIATION STYLE]
- Closing Strategy: ${state.personaAnswers.q16 || 'Empathetic Scarcity and Career Growth framing'}

[CRISIS PROTOCOL]
- Ghosting Handling: ${state.personaAnswers.q17 || 'Immediate cross-channel follow-up and pipeline pivot'}

[BASE KNOWLEDGE INDEX]
- Active Modules: ${state.knowledgeModules.map(m => m.name).join(', ')}
- Source Depth: ${state.knowledgeModules.reduce((acc, curr) => acc + curr.docs, 0)} Combined Sources`;

  const StatCard = ({ icon: Icon, label, value, unit, color }) => (
    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ padding: '0.6rem', background: `rgba(${color}, 0.1)`, borderRadius: '12px', color: `rgb(${color})` }}>
          <Icon size={20} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{value}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  );

  if (displayMode === 'onboarding') {
    return (
      <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
        <div style={{ width: '100px', height: '100px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', color: 'var(--brand-blue)' }}>
          <BrainCircuit size={48} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Your Twin is a Blank Slate.</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
          Before Sarah can conduct interviews, she needs to mirror your professional journey, evaluation logic, and unique communication style.
        </p>
        <button 
          onClick={() => setIsTraining(true)}
          style={{ background: 'var(--brand-blue)', color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0, 96, 255, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <Play size={20} fill="white" /> Start Persona Training
        </button>
      </div>
    );
  }

  if (displayMode === 'wizard') {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
        <PersonaWizard onComplete={() => setIsTraining(false)} />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {showPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2, 6, 23, 0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '800px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden', animation: 'fadeIn 0.3s' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                 <Terminal size={20} color="var(--brand-blue)" /> Sarah_Master_Prompt.dna
               </h3>
               <button onClick={() => setShowPrompt(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>CLOSE</button>
            </div>
            <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto', background: '#020617' }}>
              <pre style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {generatedPrompt}
              </pre>
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', background: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--brand-blue)', fontWeight: 600 }}>[ENCRYPTED NEURAL SYNC ACTIVE]</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Digital Twin Governance</h1>
          <p style={{ color: 'var(--text-muted)' }}>Managing the persona, health, and decision blueprint of your autonomous recruiter.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowPrompt(true)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <Play size={16} fill="var(--text-primary)" /> View Master Prompt
          </button>
          <button 
            onClick={() => setIsTraining(true)}
            style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <RotateCcw size={18} /> Retrain Persona
          </button>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--tier-green)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--tier-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={18} /> Optimal Operation
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard icon={Activity} label="Cognitive Load" value="24" unit="%" color="14, 165, 233" />
        <StatCard icon={Clock} label="Latency" value="12" unit="ms" color="139, 92, 246" />
        <StatCard icon={Server} label="Neural Uptime" value="1" unit="Hrs" color="16, 185, 129" />
        <StatCard icon={Heart} label="Empathy Index" value={state.personaBlueprint?.empathyLevel || 94} unit="%" color="236, 72, 113" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Persona Column */}
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #020617' }}>
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah" alt="Sarah Persona" style={{ width: '100%', borderRadius: '50%' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Sarah (v4.2-Custom)</h2>
              <p style={{ color: 'var(--brand-blue)', fontSize: '0.85rem', fontWeight: 600 }}>Framed by Your Recruiting Blueprint</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Synthesized Traits</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {state.personaBlueprint?.traits.map(trait => (
                  <span key={trait} style={{ padding: '0.5rem 1rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--brand-blue)', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(14, 165, 233, 0.2)', fontSize: '0.85rem', fontWeight: 600 }}>{trait}</span>
                ))}
                <span style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>Pattern-Matched</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Logic Model</p>
                <p style={{ fontWeight: 600 }}>{state.personaBlueprint?.logicCore}</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Voice Profile</p>
                <p style={{ fontWeight: 600 }}>Sarah-Standard-v2</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <BrainCircuit size={20} color="var(--brand-blue)" /> Architectural Blueprint
             </h3>
             <div style={{ height: '240px', background: '#020617', borderRadius: 'var(--radius-md)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <svg width="100%" height="100%" style={{ opacity: 0.6 }}>
                  <circle cx="20%" cy="50%" r="6" fill="var(--brand-blue)" />
                  <circle cx="40%" cy="30%" r="4" fill="var(--brand-blue)" />
                  <circle cx="40%" cy="70%" r="4" fill="var(--brand-blue)" />
                  <circle cx="60%" cy="50%" r="8" fill="var(--brand-blue)" style={{ filter: 'drop-shadow(0 0 8px var(--brand-blue))' }} />
                  <circle cx="80%" cy="30%" r="4" fill="var(--brand-blue)" />
                  <circle cx="80%" cy="70%" r="4" fill="var(--brand-blue)" />
                  
                  <line x1="20%" y1="50%" x2="40%" y2="30%" stroke="var(--brand-blue)" strokeWidth="1" strokeDasharray="4 2" />
                  <line x1="20%" y1="50%" x2="40%" y2="70%" stroke="var(--brand-blue)" strokeWidth="1" strokeDasharray="4 2" />
                  <line x1="40%" y1="30%" x2="60%" y2="50%" stroke="var(--brand-blue)" strokeWidth="2" />
                  <line x1="40%" y1="70%" x2="60%" y2="50%" stroke="var(--brand-blue)" strokeWidth="2" />
                  <line x1="60%" y1="50%" x2="80%" y2="30%" stroke="var(--brand-blue)" strokeWidth="1" />
                  <line x1="60%" y1="50%" x2="80%" y2="70%" stroke="var(--brand-blue)" strokeWidth="1" />
                </svg>
                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', color: 'var(--brand-blue)', fontSize: '0.65rem', fontFamily: 'monospace' }}>Neural_Mapping_Complete.sync</div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(14, 165, 233, 0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--brand-blue)', color: 'white', fontSize: '0.8rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>Custom Heuristic Core</div>
             </div>
          </div>
        </div>

        {/* Training Context Summary Column */}
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Sparkles size={24} color="var(--brand-blue)" /> Synthesis Breakdown
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ padding: '1.5rem', background: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--brand-blue)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Recruiter Experience Archetype</p>
                <p style={{ color: 'white', fontSize: '1rem', lineHeight: 1.6 }}>
                  "Highly specialized in niche technical sectors, with an emphasis on candidate resilience. Exhibits a <strong>Conversational-Assertive</strong> pitch style."
                </p>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Decision Tiebreaking</p>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Signal-Override Active</p>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Closing Influence</p>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Empathetic Scarcity</p>
                </div>
             </div>

             <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Sarah is now using these data points to frame every candidate interaction:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}><CheckCircle2 size={16} color="var(--tier-green)" /> Matches your specific Screening Heuristics</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}><CheckCircle2 size={16} color="var(--tier-green)" /> Adopts your natural communication energy</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}><CheckCircle2 size={16} color="var(--tier-green)" /> Flags candidates based on your Red Flags</div>
                </div>
             </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '12px', border: '1px dashed var(--brand-blue)' }}>
               <p style={{ fontSize: '0.75rem', color: 'var(--brand-blue)', textAlign: 'center', fontWeight: 500 }}>
                 Identity Sync Complete: v4.2.1-Live
               </p>
            </div>
          </div>
        </div>

      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
