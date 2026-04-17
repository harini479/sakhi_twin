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
  { id: 'JAN-2026-002', name: 'deppzz', contact: '1234567898', gender: 'Female', date: '2026-02-06', status: 'ACTIVE' },
  { id: 'JAN-2026-001', name: 'divya', contact: '12345678905', gender: 'Female', date: '2026-01-27', status: 'ACTIVE' },
];

const FrontDesk = () => {
  const [activeTab, setActiveTab] = useState('Patients');
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', contact: '', gender: 'Female', dob: '' });

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
        {['Patients', 'Convert'].map(tab => (
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
        {/* Left Filters */}
        <div className="w-[240px] shrink-0">
          <Card icon={Filter} title="Filters" action={<Filter size={14} className="text-text-secondary" />}>
            <div className="space-y-6 mt-2">
              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-3">Status</p>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Active', 'Discharged'].map(s => (
                    <button 
                      key={s} 
                      className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-all ${
                        s === 'Active' || s === 'All' ? 'bg-primary-light text-primary border-primary' : 'border-transparent text-text-secondary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-3">Gender</p>
                <select className="w-full bg-white border border-border-color rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>All Genders</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-3">Month</p>
                <input type="month" className="w-full bg-white border border-border-color rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Patient List */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input type="text" placeholder="Search patients..." className="input-search !rounded-lg !h-10 !px-10" />
            </div>
            <Button icon={Plus} onClick={() => setShowModal(true)}>New Patient</Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-border-color">
                  <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Patient Name / ID</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Reg. Date</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">Actions</th>
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
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-text-secondary">
                        <Eye size={16} className="cursor-pointer hover:text-primary" />
                        <Edit2 size={16} className="cursor-pointer hover:text-primary" />
                        <Trash2 size={16} className="cursor-pointer hover:text-red-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
