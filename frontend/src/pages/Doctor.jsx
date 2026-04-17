import React, { useState, useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  AlertCircle, 
  BarChart3, 
  BookOpen, 
  CheckCircle2, 
  History, 
  LayoutDashboard,
  Zap,
  Clock,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Badge, Button, Card } from '../components/ui';

// Custom Node for React Flow
const CustomNode = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-lg bg-primary-light border-2 border-primary text-primary min-w-[120px] text-center">
    <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-primary" />
    <div className="text-[12px] font-bold uppercase tracking-tighter">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-primary" />
  </div>
);

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  { id: '1', type: 'custom', position: { x: 250, y: 0 }, data: { label: 'Cycle Intake' } },
  { id: '2', type: 'custom', position: { x: 250, y: 100 }, data: { label: 'Follicle Tracking' } },
  { id: '3', type: 'custom', position: { x: 250, y: 200 }, data: { label: 'Hormone Labs' } },
  { id: '4', type: 'custom', position: { x: 100, y: 300 }, data: { label: 'Ops Triage' } },
  { id: '5', type: 'custom', position: { x: 400, y: 300 }, data: { label: 'Direct Reply' } },
  { id: '6', type: 'custom', position: { x: 250, y: 400 }, data: { label: 'Expert Review' } },
  { id: '7', type: 'custom', position: { x: 250, y: 500 }, data: { label: 'WhatsApp Send' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e3-5', source: '3', target: '5' },
  { id: 'e4-6', source: '4', target: '6', animated: true },
  { id: 'e5-6', source: '5', target: '6' },
  { id: 'e6-7', source: '6', target: '7', animated: true },
];

const ANALYTICS_DATA = [
  { day: 'Mon', ai: 75, human: 15 },
  { day: 'Tue', ai: 82, human: 10 },
  { day: 'Wed', ai: 68, human: 20 },
  { day: 'Thu', ai: 90, human: 5 },
  { day: 'Fri', ai: 85, human: 12 },
  { day: 'Sat', ai: 55, human: 8 },
  { day: 'Sun', ai: 60, human: 10 },
];

const SOP_CONTENT = {
  'OHSS Protocol': '1. Check daily weight and urine output.\n2. Inquire about severe bloating or nausea.\n3. Flag as RED if vomiting or shortness of breath.\n4. Recommend high protein, electrolytes, and immediate review.',
  'Post-Transfer Protocol': '1. Check for spotting or heavy bleeding.\n2. Inquire about cramping severity.\n3. Instruct to continue progesterone strictly.\n4. Flag RED if pain is unmanageable or bleeding is heavy.',
  'Follicle Tracking Rules': '1. Request ultrasound report if Day 2 or Day 6.\n2. Ensure lead follicle >18mm before triggering.\n3. E2 > 3500 pg/mL = OHSS risk alert.',
};

const Doctor = () => {
  const [activeTab, setActiveTab] = useState('OHSS Protocol');
  const [sopText, setSopText] = useState(SOP_CONTENT['OHSS Protocol']);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

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

  const escalatedPatients = patients.filter(p => p.session_state?.active_handler === 'nurse' || p.session_state?.active_handler === 'doctor' || p.session_state?.is_emergency);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSopText(SOP_CONTENT[tab]);
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full pb-10">
      {/* Top Left - Knowledge Graph */}
      <Card title="Twin Knowledge Graph" className="h-[450px] relative">
        <div style={{ width: '100%', height: '340px' }} className="border rounded-lg bg-slate-50">
          <ReactFlow 
            nodes={initialNodes} 
            edges={initialEdges} 
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls className="!bg-white !shadow-sm !rounded-md border-none" />
          </ReactFlow>
        </div>
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-[12px] text-primary font-medium flex items-center gap-2">
            <Zap size={14} />
            Note: Edit SOPs below to update Twin logic in real-time.
          </p>
        </div>
      </Card>

      {/* Top Right - High-Risk Feed */}
      <Card 
        title="Escalations & Alerts" 
        action={<Badge variant="critical">{escalatedPatients.length} Active</Badge>}
        className="h-[450px] overflow-y-auto custom-scrollbar"
      >
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-text-secondary text-sm mt-10">Searching for anomalies...</p>
          ) : escalatedPatients.length === 0 ? (
            <p className="text-center text-text-secondary text-sm mt-10">No escalations at this time. Twin is resolving all chats.</p>
          ) : (
            escalatedPatients.map((item, i) => {
              const isRed = item.session_state?.is_emergency;
              return (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between hover:shadow-md transition-all ${isRed ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${isRed ? 'bg-red-500' : 'bg-amber-500'}`}>
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">{item.name}</h4>
                      <p className={`text-[12px] font-bold ${isRed ? 'text-red-700' : 'text-amber-700'}`}>
                        {isRed ? 'RED ZONE: Medical Emergency' : 'YELLOW ZONE: Nurse Escalation'}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5 italic">
                        {isRed ? 'Similarity Gate Triggered (>0.85)' : 'AI lacked confidence or rule match. Bypassed to human.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-bold text-text-secondary">Action Req</span>
                    <button className={`text-[12px] font-bold underline ${isRed ? 'text-red-600' : 'text-amber-600'}`}>Review Chat</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Bottom Left - SOP Editor */}
      <Card title="SOP Editor — Update Twin Logic" className="min-h-[450px]">
        <div className="flex gap-2 mb-6 border-b border-border-color pb-2">
          {Object.keys(SOP_CONTENT).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
                activeTab === tab ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <textarea 
          className="w-full h-[250px] bg-slate-50 border border-border-color rounded-xl p-4 font-mono text-[13px] text-text-primary focus:ring-1 focus:ring-primary outline-none"
          value={sopText}
          onChange={(e) => setSopText(e.target.value)}
        />
        <div className="mt-6 flex items-center justify-between">
          <p className="text-[11px] text-text-secondary italic flex items-center gap-2">
            <History size={12} />
            Last updated 4 hours ago by Dr. Sharma
          </p>
          <Button icon={CheckCircle2} onClick={handleSave}>
            Save & Update Twin
          </Button>
        </div>
        {saved && (
          <div className="mt-4 p-3 bg-success-light rounded-lg border border-success-green/20 animate-in fade-in slide-in-from-bottom flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success-green" />
            <span className="text-[12px] font-bold text-green-700">Knowledge base updated. Twin will use new logic.</span>
          </div>
        )}
      </Card>

      {/* Bottom Right - Clinic Pulse Analytics */}
      <Card title="Clinic Pulse" className="min-h-[450px]">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'AI Resolved', val: '84', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Human Overrides', val: '12', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Escalations Today', val: '3', color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Avg Response Time', val: '4.2 min', color: 'text-primary', bg: 'bg-primary/10' },
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-xl ${stat.bg} flex flex-col items-center justify-center`}>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
            </div>
          ))}
        </div>
        
        <div className="h-[200px]">
          <p className="text-[11px] font-bold text-text-secondary uppercase mb-4 px-2">AI vs Human Interventions — Last 7 Days</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ANALYTICS_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} 
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="ai" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="human" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default Doctor;
