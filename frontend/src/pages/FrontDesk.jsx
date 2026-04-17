import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2, 
  FileUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';

const INITIAL_PATIENTS = [
  { id: 'JAN-2026-008', name: 'Aasha', contact: '1234567891', gender: 'Female', date: '2026-04-10', status: 'ACTIVE' },
  { id: 'JAN-2026-007', name: 'Ananya S.', contact: '1234567892', gender: 'Female', date: '2026-04-05', status: 'ACTIVE' },
  { id: 'JAN-2026-006', name: 'Meena D.', contact: '1234567893', gender: 'Female', date: '2026-03-20', status: 'ACTIVE' },
  { id: 'JAN-2026-005', name: 'Meghna P.', contact: '1234567894', gender: 'Female', date: '2026-03-15', status: 'ACTIVE' },
  { id: 'JAN-2026-004', name: 'Swati T.', contact: '1234567895', gender: 'Female', date: '2026-03-01', status: 'ACTIVE' },
  { id: 'JAN-2026-003', name: 'Sanjay V.', contact: '1234567896', gender: 'Male', date: '2026-02-15', status: 'ACTIVE' },
  { id: 'JAN-2026-002', name: 'deppzz', contact: '1234567898', gender: 'Female', date: '2026-02-06', status: 'ACTIVE' },
  { id: 'JAN-2026-001', name: 'divya', contact: '12345678905', gender: 'Female', date: '2026-01-27', status: 'ACTIVE' },
];

const DUMMY_LEADS = [
  { id: 'LD-001', name: 'Priya K.', contact: '9876543210', inquiry: 'IVF Cost & Process', date: '2026-04-16', status: 'PENDING' },
  { id: 'LD-002', name: 'Rahul M.', contact: '9876543211', inquiry: 'Semen Analysis', date: '2026-04-17', status: 'CONTACTED' },
  { id: 'LD-003', name: 'Neha R.', contact: '9876543212', inquiry: 'Egg Freezing Details', date: '2026-04-17', status: 'PENDING' },
];

const FrontDesk = () => {
  const [activeTab, setActiveTab] = useState('Patients');
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', contact: '', gender: 'Female', dob: '' });
  
  const userRole = localStorage.getItem('userRole');

  const handleAddPatient = (e) => {
    e.preventDefault();
    const id = `JAN-2026-00${patients.length + 1}`;
    setPatients([{ ...newPatient, id, date: new Date().toISOString().split('T')[0], status: 'ACTIVE' }, ...patients]);
    setShowModal(false);
    setNewPatient({ name: '', contact: '', gender: 'Female', dob: '' });
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => setUploading(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex border-b border-border-color gap-8">
        {['Patients', 'Convert'].filter(t => t !== 'Convert' || userRole !== 'Doctor').map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Right Patient List */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input type="text" placeholder="Search patients..." className="input-search !rounded-lg !h-10 !px-10" />
            </div>
            <div className="flex items-center gap-3">
              <input type="date" title="Calendar" className="h-10 px-3 bg-white border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-secondary" />
              <select className="h-10 px-3 bg-white border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-secondary">
                <option>All Status</option>
                <option>Active</option>
                <option>Discharged</option>
              </select>
              <select className="h-10 px-3 bg-white border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-secondary">
                <option>All Genders</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              {userRole !== 'Doctor' && (
                <Button icon={Plus} onClick={() => setShowModal(true)}>New Patient</Button>
              )}
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            {activeTab === 'Patients' ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-border-color">
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Patient Name / ID</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Reg. Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="patient-avatar text-[11px]">{p.name.substring(0, 2).toUpperCase()}</div>
                          <div>
                            <p className="font-bold text-text-primary">{p.name}</p>
                            <p className="text-[12px] text-text-secondary">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{p.contact}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{p.gender}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{p.date}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.status.toLowerCase()}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-border-color">
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Lead Name / ID</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Inquiry</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {DUMMY_LEADS.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="patient-avatar text-[11px]">{l.name.substring(0, 2).toUpperCase()}</div>
                          <div>
                            <p className="font-bold text-text-primary">{l.name}</p>
                            <p className="text-[12px] text-text-secondary">{l.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{l.contact}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary font-medium text-primary">{l.inquiry}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{l.date}</td>
                      <td className="px-6 py-4">
                        <Badge variant={l.status === 'PENDING' ? 'moderate' : 'active'}>{l.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button className="h-8 px-3 text-[11px]">Convert</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Lab Report Upload */}
          <Card title="Lab Report Upload Zone">
            <div 
              onClick={handleUpload}
              className="mt-2 border-2 border-dashed border-border-color rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileUp size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-text-primary">Drop PDF lab report here or click to browse</p>
                <p className="text-xs text-text-secondary mt-1">Upload blood work, scans, or clinical notes</p>
              </div>
            </div>
            {uploading && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-primary-light rounded-lg border border-primary/20">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] font-semibold text-primary">Lab_Report_Janma.pdf — Processing...</span>
              </div>
            )}
          </Card>

          {/* Manual Override */}
          <div className="flex justify-start">
            <Button 
              variant="danger" 
              icon={AlertCircle}
              onClick={() => {
                if(window.confirm("This will silence the AI Twin and alert Doctor + Nurse immediately. Confirm?")) {
                  alert("Emergency alert sent!");
                }
              }}
            >
              🔴 Manual Override — Send Red Alert
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card className="w-[480px] p-8 shadow-2xl scale-in-95 animate-in" title="Add New Patient">
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1.5">Full Name</label>
                <input 
                  required
                  className="w-full bg-white border border-border-color rounded-lg h-10 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  value={newPatient.name}
                  onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1.5">WhatsApp Number</label>
                <input 
                  required
                  className="w-full bg-white border border-border-color rounded-lg h-10 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  value={newPatient.contact}
                  onChange={e => setNewPatient({...newPatient, contact: e.target.value})}
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1.5">Gender</label>
                  <select 
                    className="w-full bg-white border border-border-color rounded-lg h-10 px-3 text-sm outline-none"
                    value={newPatient.gender}
                    onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1.5">Date of Birth</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-white border border-border-color rounded-lg h-10 px-3 text-sm outline-none" 
                    value={newPatient.dob}
                    onChange={e => setNewPatient({...newPatient, dob: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Add Patient</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FrontDesk;
