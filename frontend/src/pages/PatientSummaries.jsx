import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Edit3, 
  MessageSquare, 
  ChevronRight, 
  Search,
  User,
  Activity,
  Send,
  X,
  Clock,
  ChevronDown,
  ArrowUpCircle
} from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';

// Summarized AI logic moved to dynamic mapping

const ApprovalModal = ({ patient, onClose, onApprove, summarizing }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
    <div className="w-[600px] bg-white rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 duration-300 relative">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
      >
        <X size={24} />
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#0F172A] tracking-tight mb-2">{patient.name}</h2>
        <div className="flex items-center gap-4">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">PATIENT ID: {patient.id.substring(0,8)}</p>
          <Badge variant={patient.stage === 'critical' ? 'critical' : 'moderate'} className="text-[10px] font-black tracking-widest px-3 py-1 uppercase">
            {patient.stage.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="bg-[#F0F7FF] border border-[#E1EEFF] rounded-[24px] p-8 mb-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">AI Clinical Summary</span>
          {summarizing && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-primary animate-pulse">GENERATING...</span>
            </div>
          )}
        </div>
        <p className={`text-[16px] leading-relaxed text-[#1E293B] font-medium italic ${summarizing ? 'opacity-50' : ''}`}>
          "{patient.summary}"
        </p>
      </div>

      <div className="flex justify-center">
        <Button 
          variant="success" 
          icon={CheckCircle2} 
          disabled={summarizing}
          className={`w-full h-16 text-[16px] font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg ${summarizing ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' : 'shadow-emerald-500/20'}`}
          onClick={() => {
            onApprove();
            onClose();
          }}
        >
          {summarizing ? 'Analyzing Transcripts...' : 'Approve & Send to Patient'}
        </Button>
      </div>
    </div>
  </div>
);

const PatientSummaries = () => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toast, setToast] = useState(null);

  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/patients');
        if (res.ok) {
          const data = await res.json();
          setPatients(data.patients || []);
        }
      } catch (err) {
        console.error("Fetch patients failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    // ONLY show summaries for people whose chat has "Ended" (resolved)
    const isResolved = p.session_state?.current_logic_branch === 'resolved';
    if (!isResolved) return false;

    const isCritical = p.session_state?.is_emergency;
    const matchesFilter = activeFilter === 'ALL' || (activeFilter === 'RED' && isCritical) || (activeFilter === 'YELLOW' && !isCritical);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelect = async (patient) => {
    setSummarizing(true);
    setSelectedPatient({ ...patient, summary: 'AI is analyzing latest transcripts...', stage: patient.session_state?.is_emergency ? 'critical' : 'normal' });
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/patients/${patient.id}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPatient(prev => ({ ...prev, summary: data.summary }));
      }
    } catch (e) {
      console.error("Summary fetch failed", e);
    } finally {
      setSummarizing(false);
    }
  };

  const handleApprove = () => {
    setToast(`Summary approved and sent to ${selectedPatient.name}`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-10 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[150] flex items-center gap-3 animate-in slide-in-from-right duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">Patient Summaries</h1>
          <p className="text-slate-500 font-medium mt-1">Review AI Twin medical summaries and approve patient communications.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {['ALL', 'RED', 'YELLOW'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-6 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-lg ${
                  activeFilter === f
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width Search & List */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="mb-8 flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-6 h-14 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all group">
          <Search size={22} className="text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by patient name, ID, or condition..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[16px] text-[#0F172A] placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-10">
          {loading ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing with Health Vault...</div>
          ) : filteredPatients.map((p) => {
            const isEmergency = p.session_state?.is_emergency;
            const stageLabel = isEmergency ? 'CRITICAL' : 'NORMAL';
            const displaySummary = isEmergency 
              ? `Emergency Gate Triggered. Patient reported concerning symptoms in ${p.treatment_cycle || 'current cycle'}.`
              : `Standard Twin monitoring for ${p.treatment_cycle || 'General Fertility'}. Everything looks stable.`;
            
            return (
              <div 
                key={p.id}
                onClick={() => handleSelect(p)}
                className="p-6 bg-white border border-slate-200 rounded-3xl transition-all cursor-pointer hover:border-primary hover:shadow-xl hover:-translate-y-1 group flex items-center gap-8 active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                  <User size={28} className="text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black text-lg text-[#0F172A] tracking-tight">{p.name}</h4>
                    <Badge 
                      variant={isEmergency ? 'critical' : 'moderate'} 
                      className="text-[10px] py-1 px-3 uppercase tracking-widest font-black"
                    >
                      {stageLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID: {p.id.substring(0,8)}</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <Clock size={12} />
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-[14px] text-slate-600 line-clamp-1 italic font-medium">"{displaySummary}"</p>
                </div>

                <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight size={24} />
                </div>
              </div>
            );
          })}

          {!loading && filteredPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Clock size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Queue is Clear</p>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Historical Summaries</h3>
              <p className="text-slate-400 text-sm max-w-[320px] text-center font-medium leading-relaxed">
                Patient summaries are generated automatically once a live chat session is **closed** by the clinical team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal Overlay */}
      {selectedPatient && (
        <ApprovalModal 
          patient={selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
          onApprove={handleApprove}
          summarizing={summarizing}
        />
      )}
    </div>
  );
};

export default PatientSummaries;
