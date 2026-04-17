import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Check, 
  CheckCheck, 
  MoreVertical, 
  Phone,
  Bot,
  Send,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabase';

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  moderate: { label: 'Moderate', bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  safe:     { label: 'Safe',     bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
};

const Messaging = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [twinActive, setTwinActive] = useState(true);
  const [doctorMessage, setDoctorMessage] = useState('');
  
  const [patients, setPatients] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch profiles and session states from Backend
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

  // 2. Fetch specific patient messages when selected
  useEffect(() => {
    if (!selectedId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/patients/${selectedId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setConversations(prev => ({ ...prev, [selectedId]: data.messages || [] }));
        }
      } catch (err) {
        console.error("Fetch messages failed:", err);
      }
    };
    fetchMessages();

    // 3. Setup Supabase Realtime Subscription for this patient's messages
    const channel = supabase
      .channel(`messages_${selectedId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${selectedId}` }, 
        (payload) => {
          setConversations(prev => {
            const existing = prev[selectedId] || [];
            // Basic dedupe check
            if (existing.find(m => m.message_id === payload.new.message_id)) return prev;
            return { ...prev, [selectedId]: [...existing, payload.new] };
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // Sync session state for toggle
  useEffect(() => {
    if (selectedId) {
      const p = patients.find(p => p.id === selectedId);
      if (p && p.session_state) {
        setTwinActive(p.session_state.active_handler === 'twin');
      }
    }
  }, [selectedId, patients]);

  const selectedPatient = selectedId ? patients.find(p => p.id === selectedId) : null;
  const currentMessages = selectedId ? (conversations[selectedId] || []) : [];

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPatient = (id) => {
    setSelectedId(id);
    setDoctorMessage('');
  };

  const parseFlags = (flags) => {
    if (!flags) return [];
    if (Array.isArray(flags)) return flags;
    try {
      return JSON.parse(flags);
    } catch {
      return [flags];
    }
  };

  // 4. FastAPI Toggles
  const handleToggleTwin = async () => {
    const newStatus = !twinActive;
    setTwinActive(newStatus);
    try {
      await fetch('http://127.0.0.1:8000/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedId, target_handler: newStatus ? "twin" : "doctor" })
      });
      // Locally optimistically update patient state
      setPatients(prev => prev.map(p => {
        if(p.id === selectedId) {
          return {...p, session_state: {...p.session_state, active_handler: newStatus ? "twin" : "doctor", is_emergency: newStatus ? false : p.session_state?.is_emergency}};
        }
        return p;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendDoctorMessage = async () => {
    if (!doctorMessage.trim() || !selectedId) return;
    const msgCopy = doctorMessage.trim();
    setDoctorMessage('');
    
    // Add locally for instant UI
    const optimisticMsg = {
      message_id: Date.now().toString(),
      user_id: selectedId,
      sender: 'doctor',
      text: msgCopy,
      timestamp: new Date().toISOString()
    };
    setConversations(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), optimisticMsg]
    }));

    try {
      await fetch('http://127.0.0.1:8000/dashboard/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedId, sender: 'doctor', message: msgCopy })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Helper formatting dates
  const formatTime = (ts) => {
    if(!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>Loading remote profiles...</div>
          ) : filteredPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>No patients found.</div>
          ) : (
            filteredPatients.map(p => {
              const isEmergency = p.session_state?.is_emergency;
              const hasFlags = parseFlags(p.clinical_flags).length > 0;
              return (
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
                      background: '#10b981', // green default
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {p.name.substring(0,2).toUpperCase()}
                    </div>
                  </div>

                  {/* Text & Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                        {p.name}
                      </span>
                    </div>
                    {/* METADATA STORE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {p.treatment_cycle && (
                        <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.treatment_cycle}
                        </span>
                      )}
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                        {isEmergency && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', background: '#dc2626', color: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={10} /> TAKEOVER FLAG
                          </span>
                        )}
                        {parseFlags(p.clinical_flags).map((flag, idx) => (
                           <span key={idx} style={{
                             fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                             background: '#fef2f2', color: '#ef4444', borderRadius: '4px', textTransform: 'uppercase'
                           }}>
                             {flag}
                           </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
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
                  background: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '13px'
                }}>
                  {selectedPatient.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                    {selectedPatient.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>WhatsApp Channel</span>
                    <span style={{ fontSize: '11px', color: twinActive ? '#3b82f6' : '#ef4444', fontWeight: 700 }}> • {twinActive ? 'AI Operating' : 'Manual Override'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* End/Archive Button */}
                <button 
                  onClick={async () => {
                    if(window.confirm("Ending this session will move it to the Summaries dashboard and archive the chat. Continue?")) {
                      await fetch('http://127.0.0.1:8000/handover/resolve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: selectedId, target_handler: 'twin' })
                      });
                      window.location.reload(); // Refresh to clear active list
                    }
                  }}
                  style={{ 
                    padding: '6px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    background: '#fff', 
                    color: '#64748b', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    cursor: 'pointer',
                    marginRight: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Check size={14} /> RESOLVE CHAT
                </button>
                {/* Twin Toggle to FastAPI Handover */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: twinActive ? '#eff6ff' : '#fef2f2', border: `1px solid ${twinActive ? '#bfdbfe' : '#fecaca'}`, borderRadius: '10px', padding: '6px 12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                  onClick={handleToggleTwin}
                >
                  {twinActive ? <Bot size={15} color="#3b82f6" /> : <AlertTriangle size={15} color="#ef4444" />}
                  <span style={{ fontSize: '11px', fontWeight: 800, color: twinActive ? '#3b82f6' : '#ef4444', letterSpacing: '0.04em', userSelect: 'none' }}>
                    {twinActive ? 'TWIN ACTIVE' : 'RAG MUTED'}
                  </span>
                  {/* Toggle pill */}
                  <div style={{ width: '32px', height: '18px', borderRadius: '999px', background: twinActive ? '#3b82f6' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: '4px' }}>
                    <div style={{ position: 'absolute', top: '2px', left: twinActive ? '16px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#F8FAFC' }}>
              {currentMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', marginTop: '40px' }}>Loading secured chat history...</div>
              ) : (
                currentMessages.map((msg, index) => {
                  const isTwin = msg.sender === 'twin';
                  const isDoctor = msg.sender === 'doctor' || msg.sender === 'ops';
                  
                  return (
                    <div
                      key={msg.message_id || index}
                      style={{
                        display: 'flex',
                        justifyContent: (isTwin || isDoctor) ? 'flex-end' : 'flex-start',
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
                          textAlign: (isTwin || isDoctor) ? 'right' : 'left',
                          color: isDoctor ? '#7c3aed' : isTwin ? '#0ea5e9' : '#94a3b8'
                        }}>
                          {isDoctor ? 'Clinic (Manual)' : isTwin ? 'AI Twin' : 'Patient (WhatsApp)'}
                        </div>
                        {/* Bubble */}
                        <div style={{
                          padding: '14px 18px',
                          borderRadius: (isTwin || isDoctor) ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                          background: isDoctor ? '#7c3aed' : isTwin ? '#0ea5e9' : '#ffffff',
                          color: (isTwin || isDoctor) ? '#ffffff' : '#1e293b',
                          fontSize: '14px',
                          lineHeight: '1.65',
                          fontWeight: 500,
                          boxShadow: isDoctor ? '0 2px 8px rgba(124,58,237,0.25)' : isTwin ? '0 2px 8px rgba(14,165,233,0.25)' : '0 1px 4px rgba(0,0,0,0.07)',
                          border: (isTwin || isDoctor) ? 'none' : '1px solid #e2e8f0'
                        }}>
                          {msg.text}
                          <div style={{
                            fontSize: '10px',
                            marginTop: '8px',
                            textAlign: 'right',
                            color: (isTwin || isDoctor) ? 'rgba(255,255,255,0.65)' : '#94a3b8',
                            fontWeight: 600
                          }}>
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
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
                    Digital Twin is active and handling this thread... Disable TWIN to type.
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
                      placeholder="Type your WhatsApp response directly to the patient..."
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
              Select a patient from the Metadata left rail to view WhatsApp history and Session State.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
