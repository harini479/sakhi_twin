import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Mic, 
  MicOff, 
  Database,
  Brain,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

const KnowledgeHub = () => {
  const [activeScenario, setActiveScenario] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [context, setContext] = useState(null);
  const [scenarios, setScenarios] = useState([
    {
      id: 'scene-initial',
      title: 'Pending Extraction...',
      description: 'Waiting for brain factory to identify logical gaps...',
      source: 'System',
      status: 'pending'
    }
  ]);

  const [transcript, setTranscript] = useState('');
  const [activeTab, setActiveTab] = useState('interview');

  // Load industry context and scenarios
  useEffect(() => {
    fetch('/api/context')
      .then(res => res.json())
      .then(data => setContext(data))
      .catch(err => console.error("Context fetch failed:", err));
      
    // Re-add demo scenarios for the initial walk-through
    setScenarios([
      {
        id: 'scene-771k',
        title: 'Threshold Violation Case',
        description: 'Primary protocol suggests a baseline dose, but patient variables indicate high risk. Resolve the divergence.',
        source: 'Master Protocol v2',
        status: 'pending'
      }
    ]);
  }, []);

  const domainLabel = context?.domain_name || "Brain Factory";
  const roleLabel = context?.expert_role || "Expert Persona Capture";

  const handleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
          setAudioChunks(chunks);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setTranscript('Recording in progress...');
      } catch (err) {
        console.error("Mic access denied:", err);
      }
    } else {
      mediaRecorder.stop();
      setIsRecording(false);
      setTranscript('Processing transcription locally...');
    }
  };

  const handleSubmit = async () => {
    if (!activeScenario || audioChunks.length === 0) {
      alert("Please record your decision before submitting.");
      return;
    }
    
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('document_id', 'doc-auto');
    formData.append('scenario_id', activeScenario.id);

    try {
      const response = await fetch('/api/resolve', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      
      setTranscript(result.transcript);
      setTimeout(() => {
        const updated = scenarios.map(s => 
          s.id === activeScenario.id ? { ...s, status: 'auditing' } : s
        );
        setScenarios(updated);
        setActiveTab('audit');
      }, 1000);
    } catch (error) {
      console.error('Resolution error:', error);
    }
  };

  const handleCommit = async (id, type) => {
    try {
      await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: id,
          expert_decision: transcript,
          archetype: type
        })
      });

      const updated = scenarios.map(s => 
        s.id === id ? { ...s, status: 'committed', impact: type } : s
      );
      setScenarios(updated);
      setActiveScenario(null);
      setActiveTab('interview');
    } catch (err) {
      console.error("Commit failed:", err);
    }
  };

  return (
    <div className="flex h-full bg-[#F8FAFC] overflow-hidden font-inter text-slate-800">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Database className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold truncate">{domainLabel}</h1>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('interview')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${activeTab === 'interview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              EXTRACTION
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${activeTab === 'audit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              VISUAL AUDIT
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'interview' ? (
            <>
              <div className="px-2 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Expert Resolution</span>
              </div>
              {scenarios.filter(s => s.status === 'pending').map(scenario => (
                <motion.div
                  key={scenario.id}
                  onClick={() => setActiveScenario(scenario)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    activeScenario?.id === scenario.id 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-slate-700 text-sm">{scenario.title}</h3>
                    <ChevronRight className={`w-4 h-4 text-slate-400 ${activeScenario?.id === scenario.id ? 'text-indigo-500' : ''}`} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scenario.description}</p>
                </motion.div>
              ))}
            </>
          ) : (
            <>
              <div className="px-2 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Verification Gate</span>
              </div>
              {scenarios.filter(s => s.status === 'auditing').map(scenario => (
                <motion.div
                  key={scenario.id}
                  onClick={() => setActiveScenario(scenario)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    activeScenario?.id === scenario.id 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="font-semibold text-slate-700 text-sm">{scenario.title}</h3>
                  </div>
                  <p className="text-[10px] text-green-600 font-bold uppercase">Ready for Sign-off</p>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col relative text-slate-800">
        <AnimatePresence mode="wait">
          {activeScenario ? (
            activeTab === 'interview' ? (
              <motion.div 
                key="interview-stage"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex-1 p-8 overflow-y-auto"
              >
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 mb-8">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">High Complexity</span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-slate-500 text-xs font-medium uppercase tracking-tight">{activeScenario.source}</span>
                    </div>

                    <h2 className="text-3xl font-bold mb-6">{activeScenario.title}</h2>
                    
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                      <div className="flex items-center gap-2 mb-4 text-indigo-600">
                        <Brain className="w-5 h-5" />
                        <span className="font-bold text-xs uppercase tracking-widest">Synthetic Scenario</span>
                      </div>
                      <p className="text-lg text-slate-700 leading-relaxed italic border-l-4 border-indigo-100 pl-6 mb-8 text-slate-800">
                        "{activeScenario.description}"
                      </p>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="text-lg font-bold mb-1">{roleLabel}</h4>
                          <p className="text-slate-400 text-sm">State your decision verbally...</p>
                        </div>
                        <button onClick={handleRecord} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-indigo-600'}`}>
                          {isRecording ? <MicOff /> : <Mic />}
                        </button>
                      </div>
                      <div className="min-h-[120px] bg-white/5 rounded-xl p-6 border border-white/10 italic text-slate-300">
                        {transcript || (isRecording ? 'Listening...' : 'Click mic to start...')}
                      </div>
                      <div className="mt-8 flex justify-end">
                        <button disabled={!transcript} onClick={handleSubmit} className="px-8 py-3 bg-green-500 disabled:opacity-30 rounded-full font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Submit to Audit
                        </button>
                      </div>
                    </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="audit-stage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 p-8 bg-slate-50 overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-8 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold text-xs uppercase tracking-widest">Echo Verification: PASSED</span>
                    </div>

                    <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent mb-8">Logic Sign-off</h2>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4">Extracted Decision</h4>
                                <p className="text-slate-800 font-semibold italic">"{transcript}"</p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-6 text-center">Classify Impact Archetype</h4>
                            
                            <div className="flex-1 space-y-4">
                                {[
                                    { id: 'Safety', color: 'bg-red-500', desc: 'Critical clinical outcome risk' },
                                    { id: 'Structural', color: 'bg-indigo-500', desc: 'Process or protocol integrity' },
                                    { id: 'Informational', color: 'bg-slate-500', desc: 'General knowledge only' }
                                ].map(type => (
                                    <button 
                                        key={type.id}
                                        onClick={() => handleCommit(activeScenario.id, type.id)}
                                        className={`w-full p-4 rounded-xl text-left border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-700">{type.id}</span>
                                            <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                        </div>
                                        <p className="text-[10px] text-slate-400">{type.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
              </motion.div>
            )
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-20 text-center"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-8">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Knowledge Hub</h2>
              <p className="text-slate-500 max-w-sm">Select a pending logical gap from the sidebar to begin expert extraction.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KnowledgeHub;
