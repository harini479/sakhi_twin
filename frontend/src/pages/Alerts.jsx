import React, { useState } from 'react';
import { AlertCircle, PhoneForwarded, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';

const DUMMY_ALERTS = [
  { id: 1, patientName: 'Aasha', timestamp: 'Just now', type: 'OHSS Risk', description: 'Patient experiencing severely decreased urination and bloating. Urgent review necessary.', status: 'PENDING' },
  { id: 2, patientName: 'Ananya S.', timestamp: '10 mins ago', type: 'Post-Transfer Bleeding', description: 'Patient reports unusual heavy bleeding 6 days post embryo transfer.', status: 'PENDING' },
  { id: 3, patientName: 'Ritika Sharma', timestamp: '1 hr ago', type: 'Severe Pain', description: 'Unbearable abdominal cramping requiring immediate clinical intervention.', status: 'RESOLVED' },
];

const Alerts = () => {
  const [alerts, setAlerts] = useState(DUMMY_ALERTS);

  const handleEscalate = (id) => {
    // Escalate the alarm and switch it to resolved from the Front Desk end
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ESCALATED' } : a));
    alert('Emergency signal rapidly routed to the Doctor and Nurse dashboards!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 text-red-600 flex items-center justify-center rounded-xl shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Emergency Alerts</h2>
          <p className="text-sm text-slate-500 font-medium">Active twin escalations awaiting clinical redirection.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {alerts.map(alert => (
          <Card key={alert.id} className={`transition-all duration-300 ${alert.status === 'PENDING' ? 'border-2 border-red-200 bg-red-50/50 shadow-sm' : 'border border-slate-200 bg-white opacity-80'}`}>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className={`mt-1 p-2 rounded-full ${alert.status === 'PENDING' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                  {alert.status === 'PENDING' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-slate-800">{alert.patientName}</h3>
                    <Badge variant={alert.status === 'PENDING' ? 'critical' : 'safe'}>{alert.status}</Badge>
                    <span className="text-xs font-semibold text-slate-400">{alert.timestamp}</span>
                  </div>
                  <h4 className="text-sm font-bold text-red-600 mb-2">{alert.type}</h4>
                  <p className="text-sm text-slate-600 max-w-xl leading-relaxed">{alert.description}</p>
                </div>
              </div>

              {alert.status === 'PENDING' ? (
                <Button 
                  onClick={() => handleEscalate(alert.id)}
                  className="bg-red-600 hover:bg-red-700 text-white border-none shadow-md shadow-red-200 gap-2"
                >
                  <PhoneForwarded size={16} /> Connect Clinical Team
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg font-bold text-sm">
                  <CheckCircle2 size={16} /> Escalated
                </div>
              )}
            </div>
          </Card>
        ))}
        {alerts.filter(a => a.status === 'PENDING').length === 0 && (
           <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle2 size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">No Active Emergencies</h3>
             <p className="text-slate-500 font-medium">All front desk alerts have been resolved or successfully escalated to clinical staff.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
