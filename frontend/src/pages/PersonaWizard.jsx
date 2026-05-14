import { useState } from 'react';
import { ArrowRight, ArrowLeft, BrainCircuit, Sparkles, CheckCircle2, Terminal } from 'lucide-react';
import { useDemo } from '../context/DemoContext';

const QUESTIONS = [
  {
    id: 's1',
    title: 'Background & Experience',
    questions: [
      { id: 'q1', text: "Tell me about your journey into recruiting — how long have you been doing this, what roles or industries do you specialize in, and what's kept you in this profession?" },
      { id: 'q2', text: "Walk me through a hire you're most proud of — what made it hard, and what did you do to close it?" }
    ]
  },
  {
    id: 's2',
    title: 'Screening & Evaluation',
    questions: [
      { id: 'q3', text: "When a new job req lands on your desk, what is the very first thing you do before reaching out to a single candidate?" },
      { id: 'q4', text: "Take me through your candidate screening process from sourcing to the moment you decide to move someone forward — every touchpoint." },
      { id: 'q5', text: "How do you evaluate a resume in the first 60 seconds? What are you actually scanning for?" },
      { id: 'q6', text: "What questions do you always ask in a screening call — and what are you really trying to uncover with each one?" }
    ]
  },
  {
    id: 's3',
    title: 'Voice & Communication',
    questions: [
      { id: 'q7', text: "How would you describe your natural communication style — your tone, your energy, the way you come across to candidates and hiring managers?" },
      { id: 'q8', text: "Give me 3 to 5 phrases or sentences you actually say often — real ones, not polished ones. Things people consistently hear from you." },
      { id: 'q9', text: "How do you pitch a role to a passive candidate who wasn't looking and has no obvious reason to move?" }
    ]
  },
  {
    id: 's4',
    title: 'Decision Making & Relationships',
    questions: [
      { id: 'q10', text: "When you're choosing between two strong candidates who are very close, what is the tiebreaker for you?" },
      { id: 'q11', text: "When a hiring manager has an unrealistic picture of the candidate they want, how do you handle that conversation?" },
      { id: 'q12', text: "How do you manage pushback from a hiring manager who disagrees with your recommendation — do you advocate, defer, or something in between?" }
    ]
  },
  {
    id: 's5',
    title: 'Red Flags & Green Flags',
    questions: [
      { id: 'q13', text: "What are your top red flags — on a resume or in a screening call — that will almost always disqualify someone??" },
      { id: 'q14', text: "What signals make you immediately excited about a candidate, even before you've spoken to them?" }
    ]
  },
  {
    id: 's6',
    title: 'Offer & Closing',
    questions: [
      { id: 'q15', text: "Walk me through how you handle the offer stage — from the moment you know an offer is coming to the moment it's accepted." },
      { id: 'q16', text: "How do you close a candidate who is genuinely on the fence — sitting on two offers or hesitant to leave their current role?" }
    ]
  },
  {
    id: 's7',
    title: 'Scenarios & Pressure',
    questions: [
      { id: 'q17', text: "A strong candidate ghosts you one day before the final round. Walk me through exactly what you do, step by step." },
      { id: 'q18', text: "You've been searching for 8 weeks with no suitable candidates and the hiring manager is losing patience — what do you say, and what do you do?" }
    ]
  }
];

export default function PersonaWizard({ onComplete }) {
  const { state, dispatch, ACTIONS } = useDemo();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(state.personaAnswers || {});
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinalize();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleFinalize = () => {
    setIsSynthesizing(true);
    // Simulate complex analysis
    setTimeout(() => {
      const blueprint = {
        name: "Custom Twin Persona",
        traits: ["Pattern-Matched", "Experience-Driven"],
        voice: "Adaptive-Recruiter-v1",
        logicCore: "Heuristic-Hybrid",
        empathyLevel: 85
      };
      dispatch({ type: ACTIONS.COMPLETE_TRAINING, payload: blueprint });
      onComplete();
    }, 4500);
  };

  const updateAnswer = (id, val) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
    dispatch({ type: ACTIONS.SAVE_PERSONA, payload: { [id]: val } });
  };

  if (isSynthesizing) {
    return (
      <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', border: '2px solid var(--brand-blue)', position: 'relative' }}>
          <BrainCircuit size={48} color="var(--brand-blue)" className="pulse-slow" />
          <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px dashed var(--brand-blue)', animation: 'spin 10s linear infinite' }}></div>
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Synthesizing Persona Blueprint</h2>
        <div style={{ width: '300px', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ height: '100%', background: 'var(--brand-blue)', animation: 'progress 4s ease-in-out' }}></div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
          [SYS]: Analyzing journey markers... <br/>
          [NLP]: Distilling communication tone... <br/>
          [LOGIC]: Mapping decision heuristics...
        </p>
      </div>
    );
  }

  const section = QUESTIONS[currentStep];

  return (
    <div style={{ animation: 'slideRight 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Training Phase {currentStep + 1} of {QUESTIONS.length}
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{section.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {QUESTIONS.map((_, idx) => (
            <div key={idx} style={{ width: '24px', height: '4px', borderRadius: '2px', background: idx <= currentStep ? 'var(--brand-blue)' : 'var(--bg-secondary)' }}></div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
        {section.questions.map(q => (
          <div key={q.id}>
            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{q.text}</label>
            <textarea 
              value={answers[q.id] || ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              placeholder="Tell Sarah your approach..."
              style={{ width: '100%', minHeight: '120px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical', transition: 'var(--transition-fast)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
        <button 
          onClick={handleBack}
          disabled={currentStep === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: currentStep === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
        >
          <ArrowLeft size={18} /> Previous Section
        </button>
        <button 
          onClick={handleNext}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--brand-blue)', color: 'white', border: 'none', padding: '0.8rem 2.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 96, 255, 0.3)' }}
        >
          {currentStep === QUESTIONS.length - 1 ? 'Finalize & Synthesize' : 'Next Section'} <ArrowRight size={18} />
        </button>
      </div>

      <style>{`
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        .pulse-slow { animation: pulseAnim 3s infinite; }
        @keyframes pulseAnim { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
