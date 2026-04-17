import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Check, 
  CheckCheck, 
  MoreVertical, 
  Phone,
  Bot,
  Send
} from 'lucide-react';

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  moderate: { label: 'Moderate', bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  safe:     { label: 'Safe',     bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
};

const PATIENTS = [
  { 
    id: '1', 
    name: 'Aasha', 
    initials: 'AA',
    color: '#ef4444',
    stage: 'critical',
    lastMessage: 'AI Twin recommended increasing fluid intake...', 
    time: '4 min ago', 
    status: 'received',
    messages: [
      { id: 1, sender: 'Patient', text: 'My stomach is extremely bloated and I feel nauseous. It is been 3 days since my egg retrieval.', time: '09:00 AM' },
      { id: 2, sender: 'AI Twin', text: 'I understand how uncomfortable that must be. Bloating after egg retrieval can occur. Have you noticed any decreased urination or shortness of breath?', time: '09:02 AM' },
      { id: 3, sender: 'Patient', text: 'Yes, I have not gone to the bathroom much since yesterday.', time: '09:05 AM' },
      { id: 4, sender: 'AI Twin', text: 'Decreased urination with severe bloating could indicate Ovarian Hyperstimulation Syndrome (OHSS). I have flagged this to the clinical team immediately. Please start drinking electrolytes and rest.', time: '09:06 AM' }
    ]
  },
  { 
    id: '2', 
    name: 'Ananya S.', 
    initials: 'AN',
    color: '#8b5cf6',
    stage: 'critical',
    lastMessage: 'Whisper Draft pending review...', 
    time: 'Just now', 
    status: 'seen',
    hasPendingWhisper: true,
    messages: [
      { id: 1, sender: 'Patient', text: 'I just had some light bleeding and cramping today. I am currently 6 days post embryo transfer.', time: '09:45 AM' }
    ],
    whisperDraft: {
      text: "Light spotting and mild cramping can be normal implantation symptoms 6 days post-transfer. However, please continue your Progesterone support exactly as prescribed, abstain from heavy lifting, and monitor the bleeding. If it becomes heavy like a period, alert us immediately.",
      logic: "SKL_EXPERT_SYNTHESIS triggered. Post-transfer spotting protocol. Escalated past Ops Twin for Fertility Expert validation.",
      time: "09:46 AM"
    }
  },
  { 
    id: '3', 
    name: 'Shreya', 
    initials: 'SG',
    color: '#f59e0b',
    stage: 'moderate',
    lastMessage: 'Upload link provided for ultrasound...', 
    time: '12 min ago', 
    status: 'sent',
    messages: [
      { id: 1, sender: 'Patient', text: 'I got my Day 2 follicular scan done at the local clinic today.', time: '10:15 AM' },
      { id: 2, sender: 'AI Twin', text: 'Excellent. Could you please upload the ultrasound report using the patient portal link we sent earlier?', time: '10:17 AM' },
      { id: 3, sender: 'Patient', text: 'Done. Please check.', time: '10:20 AM' },
      { id: 4, sender: 'AI Twin', text: 'Received. The Operations Team has attached it to your cycle file. The doctor will review the antral follicle count before your stimulation starts tomorrow.', time: '10:21 AM' }
    ]
  },
  { 
    id: '4', 
    name: 'Arya', 
    initials: 'AR',
    color: '#10b981',
    stage: 'safe',
    lastMessage: 'Dosing instructions confirmed.', 
    time: '25 min ago', 
    status: 'seen',
    messages: [
      { id: 1, sender: 'Patient', text: 'Should I take my Gonal-F injection in the morning or evening?', time: '11:00 AM' },
      { id: 2, sender: 'AI Twin', text: 'Your protocol specifies that Gonal-F should be taken in the evening at approximately the same time every day, usually between 7 PM and 9 PM.', time: '11:02 AM' },
      { id: 3, sender: 'Patient', text: 'Okay, I will take it at 8 PM. Thanks.', time: '11:05 AM' },
      { id: 4, sender: 'AI Twin', text: 'Perfect. Consistency is key for optimal follicle stimulation. Reach out if you have any trouble administering the injection.', time: '11:06 AM' }
    ]
  }
];

const Messaging = () => {
  const location = useLocation();
  const [selectedId, setSelectedId] = useState(location.state?.patientId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [twinActive, setTwinActive] = useState(true);
  const [doctorMessage, setDoctorMessage] = useState('');
  const [patients, setPatients] = useState(PATIENTS);
  
  const [conversations, setConversations] = useState(
    Object.fromEntries(patients.map(p => [p.id, p.messages]))
  );

  const selectedPatient = selectedId ? patients.find(p => p.id === selectedId) : null;
  const currentMessages = selectedId ? (conversations[selectedId] || []) : [];

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPatient = (id) => {
    setSelectedId(id);
    setTwinActive(true);
    setDoctorMessage('');
  };

  const handleReleaseWhisper = () => {
    if (!selectedPatient || !selectedPatient.hasPendingWhisper) return;
    
    // Convert whisper to an actual message sent by Twin (authorized by Doctor)
    const newMsg = {
      id: Date.now(),
      sender: 'AI Twin',
      text: selectedPatient.whisperDraft.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Update local state
    setConversations(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg]
    }));
    
    // Remove the pending whisper from the patient object
    setPatients(prev => prev.map(p => 
      p.id === selectedId 
        ? { ...p, hasPendingWhisper: false, lastMessage: 'Whisper released to patient.' }
        : p
    ));
    
    // Set Twin back to active running
    setTwinActive(true);
  };

  const handleSendDoctorMessage = () => {
    if (!doctorMessage.trim() || !selectedId) return;
    const newMsg = {
      id: Date.now(),
      sender: 'Doctor',
      text: doctorMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversations(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg]
    }));
    setDoctorMessage('');
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 136px)',
        minHeight: '400px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.06)'
      }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <div
        style={{
          width: '320px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e2e8f0',
          background: '#F8FAFC'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Communications
            </span>
            <button
              style={{
                width: '36px', height: '36px',
                background: '#0ea5e9',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(14,165,233,0.3)'
              }}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '10px',
                height: '40px',
                paddingLeft: '38px',
                paddingRight: '12px',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
                color: '#334155'
              }}
            />
          </div>
        </div>

        {/* Patient List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredPatients.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPatient(p.id)}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                background: selectedId === p.id ? '#ffffff' : 'transparent',
                border: 'none',
                borderLeft: selectedId === p.id ? '3px solid #0ea5e9' : '3px solid transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => { if (selectedId !== p.id) e.currentTarget.style.background = '#F1F5F9'; }}
              onMouseLeave={e => { if (selectedId !== p.id) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '46px', height: '46px',
                  borderRadius: '50%',
                  background: p.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px'
                }}>
                  {p.initials}
                </div>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', flexShrink: 0, marginLeft: '6px' }}>
                    {p.time}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    paddingLeft: '7px',
                    paddingRight: '7px',
                    paddingTop: '2px',
                    paddingBottom: '2px',
                    borderRadius: '999px',
                    background: SEVERITY_CONFIG[p.stage].bg,
                    color: SEVERITY_CONFIG[p.stage].color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    flexShrink: 0
                  }}>
                    {SEVERITY_CONFIG[p.stage].label}
                  </span>
                  {p.status === 'seen' && <CheckCheck size={12} color="#0ea5e9" />}
                  {p.status === 'received' && <CheckCheck size={12} color="#94a3b8" />}
                  {p.status === 'sent' && <Check size={12} color="#94a3b8" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT CHAT WINDOW ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', minWidth: 0 }}>
        {selectedPatient ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fff',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: '50%',
                  background: selectedPatient.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '13px'
                }}>
                  {selectedPatient.initials}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                    {selectedPatient.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      borderRadius: '999px',
                      background: SEVERITY_CONFIG[selectedPatient.stage].bg,
                      color: SEVERITY_CONFIG[selectedPatient.stage].color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      ● {SEVERITY_CONFIG[selectedPatient.stage].label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>WhatsApp • {twinActive ? 'AI Active' : 'Doctor Override'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Twin Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: twinActive ? '#eff6ff' : '#fef2f2', border: `1px solid ${twinActive ? '#bfdbfe' : '#fecaca'}`, borderRadius: '10px', padding: '5px 10px', cursor: 'pointer' }}
                  onClick={() => setTwinActive(v => !v)}
                >
                  <Bot size={15} color={twinActive ? '#3b82f6' : '#94a3b8'} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: twinActive ? '#3b82f6' : '#ef4444', letterSpacing: '0.04em', userSelect: 'none' }}>TWIN</span>
                  {/* Toggle pill */}
                  <div style={{ width: '32px', height: '18px', borderRadius: '999px', background: twinActive ? '#3b82f6' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '2px', left: twinActive ? '16px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                  </div>
                </div>
                <button style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><Phone size={18} /></button>
                <button style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#F8FAFC' }}>
              {currentMessages.map(msg => {
                const isAI = msg.sender === 'AI Twin';
                const isDoctor = msg.sender === 'Doctor';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: (isAI || isDoctor) ? 'flex-end' : 'flex-start',
                      marginBottom: '20px'
                    }}
                  >
                    <div style={{ maxWidth: '68%' }}>
                      {/* Sender label */}
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        marginBottom: '6px',
                        textAlign: (isAI || isDoctor) ? 'right' : 'left',
                        color: isDoctor ? '#7c3aed' : isAI ? '#0ea5e9' : '#94a3b8'
                      }}>
                        {isDoctor ? 'Dr. Response' : isAI ? 'AI Twin' : 'Patient'}
                      </div>
                      {/* Bubble */}
                      <div style={{
                        padding: '14px 18px',
                        borderRadius: (isAI || isDoctor) ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                        background: isDoctor ? '#7c3aed' : isAI ? '#0ea5e9' : '#ffffff',
                        color: (isAI || isDoctor) ? '#ffffff' : '#1e293b',
                        fontSize: '14px',
                        lineHeight: '1.65',
                        fontWeight: 500,
                        boxShadow: isDoctor ? '0 2px 8px rgba(124,58,237,0.25)' : isAI ? '0 2px 8px rgba(14,165,233,0.25)' : '0 1px 4px rgba(0,0,0,0.07)',
                        border: (isAI || isDoctor) ? 'none' : '1px solid #e2e8f0'
                      }}>
                        {msg.text}
                        <div style={{
                          fontSize: '10px',
                          marginTop: '8px',
                          textAlign: 'right',
                          color: (isAI || isDoctor) ? 'rgba(255,255,255,0.65)' : '#94a3b8',
                          fontWeight: 600
                        }}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* WHISPER DRAFT SECTION */}
              {selectedPatient?.hasPendingWhisper && (
                <div className="mt-6 mb-4 relative" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{
                    background: '#fef2f2',
                    border: '2px solid #fecaca',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bot size={18} color="#ef4444" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Whisper Draft • Wait for Release
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>{selectedPatient.whisperDraft.time}</span>
                    </div>
                    
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c', marginBottom: '12px', backgroundColor: '#fee2e2', padding: '8px 12px', borderRadius: '8px' }}>
                      <strong>Logic:</strong> {selectedPatient.whisperDraft.logic}
                    </div>

                    <div style={{
                      fontSize: '15px',
                      color: '#1e293b',
                      lineHeight: '1.6',
                      fontWeight: 500,
                      backgroundColor: '#ffffff',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #fca5a5'
                    }}>
                      "{selectedPatient.whisperDraft.text}"
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                      <button style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: '1px solid #fca5a5',
                        background: '#ffffff',
                        color: '#ef4444',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}>
                        Edit Draft
                      </button>
                      <button 
                        onClick={handleReleaseWhisper}
                        style={{
                        padding: '10px 24px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        Release to Patient <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
              {twinActive ? (
                /* Twin is ON — locked read-only bar */
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: '#F8FAFC',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  opacity: 0.55,
                  cursor: 'not-allowed'
                }}>
                  <Bot size={16} color="#94a3b8" style={{ marginRight: '10px', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
                    AI Twin is managing this conversation...
                  </span>
                </div>
              ) : (
                /* Twin is OFF — doctor can type */
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', flex: 1,
                    background: '#ffffff',
                    border: '2px solid #7c3aed',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    boxShadow: '0 0 0 3px rgba(124,58,237,0.08)'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', marginRight: '10px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dr</span>
                    <input
                      type="text"
                      placeholder="Type your response to the patient..."
                      value={doctorMessage}
                      onChange={e => setDoctorMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendDoctorMessage()}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px',
                        color: '#1e293b',
                        background: 'transparent',
                        fontWeight: 500
                      }}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSendDoctorMessage}
                    style={{
                      width: '44px', height: '44px',
                      borderRadius: '12px',
                      background: doctorMessage.trim() ? '#7c3aed' : '#e2e8f0',
                      border: 'none',
                      cursor: doctorMessage.trim() ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                      transition: 'background 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{
              width: '100px', height: '100px',
              background: '#F1F5F9',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <MessageCircle size={48} color="#CBD5E1" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '10px', letterSpacing: '-0.02em' }}>
              Select a conversation
            </div>
            <p style={{ maxWidth: '280px', textAlign: 'center', color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
