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
  AlertTriangle,
  Activity
} from 'lucide-react';
import { supabase } from '../supabase';

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  moderate: { label: 'Moderate', bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  safe: { label: 'Safe', bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
};

const DoctorMessaging = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewRole, setViewRole] = useState(sessionStorage.getItem('janma_role') || 'doctor');
  const [humanMessage, setHumanMessage] = useState('');
  const [takeoverPrompt, setTakeoverPrompt] = useState(null);
  const [liveRecap, setLiveRecap] = useState(null);
  const [fetchingRecap, setFetchingRecap] = useState(false);

  useEffect(() => {
    const syncRole = () => setViewRole(sessionStorage.getItem('janma_role') || 'doctor');
    window.addEventListener('roleChange', syncRole);
    return () => window.removeEventListener('roleChange', syncRole);
  }, []);

  const [patients, setPatients] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [pendingPatientId, setPendingPatientId] = useState(null);

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
    const channelName = `messages_${selectedId}_${viewRole}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `user_id=eq.${selectedId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations(prev => {
              const existing = prev[selectedId] || [];
              if (existing.find(m => m.message_id === payload.new.message_id)) return prev;
              return { ...prev, [selectedId]: [...existing, payload.new] };
            });
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, viewRole]);

  // 3b. Setup Supabase Realtime Subscription for session_states globally
  useEffect(() => {
    const channel = supabase
      .channel('db_session_states_doctor')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_states' }, (payload) => {
        const newState = payload.new;
        if (!newState?.user_id) return;
        setPatients(prev => prev.map(p => {
          if (p.id === newState.user_id) {
            // MERGE to handle potential partial payloads
            return { ...p, session_state: { ...p.session_state, ...newState } };
          }
          return p;
        }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_states' }, (payload) => {
        const newState = payload.new;
        if (!newState?.user_id) return;
        setPatients(prev => prev.map(p => {
          if (p.id === newState.user_id) return { ...p, session_state: newState };
          return p;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const selectedPatient = selectedId ? patients.find(p => p.id === selectedId) : null;
  const activeH = selectedPatient?.session_state?.active_handler || 'twin';
  const currentMessages = selectedId ? (conversations[selectedId] || []) : [];

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPatient = (id) => {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;

    const currentHandler = patient.session_state?.active_handler || 'twin';
    if (currentHandler !== viewRole) {
      setPendingPatientId(id);
    } else {
      setSelectedId(id);
      setHumanMessage('');
    }
  };

  const handleTakeover = async () => {
    if (!pendingPatientId) return;
    try {
      await fetch('http://127.0.0.1:8000/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: pendingPatientId, target_handler: viewRole })
      });
      setPatients(prev => prev.map(p => p.id === pendingPatientId ? { ...p, session_state: { ...p.session_state, active_handler: viewRole } } : p));

      setSelectedId(pendingPatientId);
      setHumanMessage('');
      setPendingPatientId(null);
    } catch (e) {
      console.error("Takeover failed", e);
    }
  };

  const handleCancelTakeover = () => {
    setPendingPatientId(null);
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

  // 4. Role and Escalation Actions
  const handleToggleHandover = async () => {
    const isTakingOver = (activeH === 'twin');
    const targetHandler = isTakingOver ? viewRole : 'twin';
    try {
      await fetch('http://127.0.0.1:8000/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedId, target_handler: targetHandler })
      });
      setPatients(prev => prev.map(p => p.id === selectedId ? { ...p, session_state: { ...p.session_state, active_handler: targetHandler, is_emergency: isTakingOver ? true : false } } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const handleGetLiveRecap = async () => {
    if (!selectedId) return;
    setFetchingRecap(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/patients/${selectedId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setLiveRecap(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingRecap(false);
    }
  };

  const handleSendMessage = async () => {
    if (!humanMessage.trim() || !selectedId) return;
    const msgCopy = humanMessage.trim();
    setHumanMessage('');

    // Add locally for instant UI
    const optimisticMsg = {
      message_id: Date.now().toString(),
      user_id: selectedId,
      sender: viewRole,
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
        body: JSON.stringify({ user_id: selectedId, sender: viewRole, message: msgCopy })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Helper formatting dates
  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        position: 'relative',
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
              const activeH = p.session_state?.active_handler || 'twin';
              const isGrayedOut = (viewRole === 'doctor' && activeH === 'nurse') || (viewRole === 'nurse' && activeH === 'doctor');
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
                    transition: 'background 0.15s, opacity 0.2s',
                    opacity: isGrayedOut ? 0.45 : 1,
                    filter: isGrayedOut ? 'grayscale(100%)' : 'none'
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
                      {p.name.substring(0, 2).toUpperCase()}
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
                  {selectedPatient.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                    {selectedPatient.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>WhatsApp Channel</span>
                    <span style={{ fontSize: '11px', color: (activeH === 'twin' && selectedPatient?.session_state?.is_emergency) ? '#ef4444' : activeH === 'twin' ? '#3b82f6' : activeH === 'doctor' ? '#ef4444' : '#d97706', fontWeight: 700 }}>
                      • {(activeH === 'twin' && selectedPatient?.session_state?.is_emergency) ? 'HUMAN TAKEOVER TRIGGERED (ALERT)' : activeH === 'twin' ? 'AI Operating' : activeH === 'doctor' ? 'Doctor Override (RED)' : 'Nurse Override (YELLOW)'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* End/Archive Button */}
                <button
                  onClick={async () => {
                    if (window.confirm("Ending this session will move it to the Summaries dashboard and archive the chat. Continue?")) {
                      await fetch('http://127.0.0.1:8000/handover/resolve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: selectedId, target_handler: 'twin' })
                      });
                      // Update local state dynamically
                      setPatients(prev => prev.map(p => p.id === selectedId ? { ...p, session_state: { ...p.session_state, active_handler: 'twin', is_emergency: false, current_logic_branch: 'resolved' } } : p));
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Check size={14} /> RESOLVE CHAT
                </button>

                <button
                  onClick={handleGetLiveRecap}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e1e7ff',
                    background: '#f5f7ff',
                    color: '#4f46e5',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginRight: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Activity size={14} /> {fetchingRecap ? 'ANALYZING...' : 'LIVE AI RECAP'}
                </button>

                {/* Human Takeover Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '6px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: (activeH === 'twin' && !selectedPatient?.session_state?.is_emergency) ? '#0ea5e9' : '#94a3b8' }}>
                    AI TWIN
                  </span>

                  <div
                    style={{
                      position: 'relative',
                      width: '44px',
                      height: '24px',
                      background: (activeH === 'twin' && !selectedPatient?.session_state?.is_emergency) ? '#cbd5e1' : (activeH === 'twin' ? '#fca5a5' : (activeH === 'doctor' ? '#ef4444' : '#d97706')),
                      borderRadius: '12px',
                      border: 'none',
                      cursor: (activeH === 'twin' || activeH === viewRole) ? 'pointer' : 'not-allowed',
                      transition: 'background 0.3s',
                      padding: 0
                    }}
                    onClick={() => (activeH === 'twin' || activeH === viewRole) && handleToggleHandover()}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: (activeH === 'twin' && !selectedPatient?.session_state?.is_emergency) ? '2px' : '22px',
                      width: '20px',
                      height: '20px',
                      background: '#ffffff',
                      borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.3s'
                    }} />
                  </div>

                  <span style={{ fontSize: '12px', fontWeight: 700, color: (activeH !== 'twin' || selectedPatient?.session_state?.is_emergency) ? (activeH === 'nurse' ? '#d97706' : '#ef4444') : '#94a3b8' }}>
                    HUMAN OVERRIDE
                  </span>
                </div>
              </div>
            </div>

            {/* Live Recap Display */}
            {liveRecap && (
              <div style={{
                margin: '0 24px 20px',
                background: '#F0F7FF',
                border: '1px solid #E1EEFF',
                borderRadius: '16px',
                padding: '16px',
                position: 'relative',
                animation: 'fadeIn 0.3s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', tracking: '0.1em' }}>AI Live Insight</span>
                  <button onClick={() => setLiveRecap(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>×</span>
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#1E293B', lineHeight: '1.5', fontStyle: 'italic' }}>
                  "{liveRecap}"
                </p>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#F8FAFC' }}>
              {currentMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', marginTop: '40px' }}>
                  Start of conversation. Wait for patient to text or initiate contact below.
                </div>
              ) : (
                currentMessages.map((msg, index) => {
                  const isTwin = msg.sender === 'twin';
                  const isClinic = msg.sender === 'doctor' || msg.sender === 'nurse' || msg.sender === 'ops';

                  return (
                    <div
                      key={msg.message_id || index}
                      style={{
                        display: 'flex',
                        justifyContent: (isTwin || isClinic) ? 'flex-end' : 'flex-start',
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
                          textAlign: (isTwin || isClinic) ? 'right' : 'left',
                          color: isClinic ? '#7c3aed' : isTwin ? '#0ea5e9' : '#94a3b8'
                        }}>
                          {msg.sender === 'doctor' ? 'Dr. Sharma (Manual)' : msg.sender === 'nurse' ? 'Nurse (Manual)' : isTwin ? 'AI Twin' : 'Patient (WhatsApp)'}
                        </div>
                        {/* Bubble */}
                        <div style={{
                          padding: '14px 18px',
                          borderRadius: (isTwin || isClinic) ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                          background: isClinic ? '#7c3aed' : isTwin ? '#0ea5e9' : '#ffffff',
                          color: (isTwin || isClinic) ? '#ffffff' : '#1e293b',
                          fontSize: '14px',
                          lineHeight: '1.65',
                          fontWeight: 500,
                          boxShadow: isClinic ? '0 2px 8px rgba(124,58,237,0.25)' : isTwin ? '0 2px 8px rgba(14,165,233,0.25)' : '0 1px 4px rgba(0,0,0,0.07)',
                          border: (isTwin || isClinic) ? 'none' : '1px solid #e2e8f0'
                        }}>
                          {msg.text}
                          <div style={{
                            fontSize: '10px',
                            marginTop: '8px',
                            textAlign: 'right',
                            color: (isTwin || isClinic) ? 'rgba(255,255,255,0.65)' : '#94a3b8',
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
              {activeH === 'twin' ? (
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
                    {selectedPatient?.session_state?.is_emergency ? 'Patient is pending takeover. Please Take Over Chat to respond.' : 'Digital Twin is active and handling this thread. Input locked.'}
                  </span>
                </div>
              ) : activeH === 'nurse' ? (
                /* Locked for Doctor because Nurse is handling */
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: '#F1F5F9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  opacity: 0.8,
                  cursor: 'not-allowed'
                }}>
                  <span style={{ flex: 1, fontSize: '14px', color: '#64748b', fontStyle: 'italic', fontWeight: 500 }}>
                    Nurse has taken over this chat. Input locked for Doctor.
                  </span>
                </div>
              ) : (
                /* Active typing logic */
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', flex: 1,
                    background: '#ffffff',
                    border: '2px solid #7c3aed',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    boxShadow: '0 0 0 3px rgba(124,58,237,0.08)'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', marginRight: '10px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{viewRole === 'doctor' ? 'DR' : 'NURSE'}</span>
                    <input
                      type="text"
                      placeholder={`Type your WhatsApp response directly to the patient as ${viewRole}...`}
                      value={humanMessage}
                      onChange={e => setHumanMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
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
                    onClick={handleSendMessage}
                    style={{
                      width: '44px', height: '44px',
                      borderRadius: '12px',
                      background: humanMessage.trim() ? '#7c3aed' : '#e2e8f0',
                      border: 'none',
                      cursor: humanMessage.trim() ? 'pointer' : 'default',
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

      {/* ── TAKEOVER MODAL ── */}
      {pendingPatientId && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, borderRadius: '24px'
        }}>
          <div style={{
            background: '#fff', width: '400px', borderRadius: '16px', padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle color="#f59e0b" size={24} /> Takeover Chat Request
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to take over this conversation?
              You will assume manual control from the Digital Twin or current operator.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleCancelTakeover}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTakeover}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: 'none',
                  background: '#7c3aed', color: '#fff', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.25)'
                }}
              >
                Yes, Takeover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorMessaging;
