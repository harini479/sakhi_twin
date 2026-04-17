import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft,
  Plus,
  CheckCircle2,
  Clock,
  Activity
} from 'lucide-react';
import { Badge, Button, Card } from '../components/ui';

// Mock Appointment Data
const APPOINTMENTS_DATA = {
  14: [
    { id: 'apt-1', time: '9 AM', patient: 'Sanjay V.', type: 'Semen Analysis Drop-off', severity: 'normal' },
  ],
  16: [
    { id: 'apt-2', time: '10 AM', patient: 'Swati T.', type: 'Follicular Scan (Day 6)', severity: 'normal' },
    { id: 'apt-3', time: '1 PM', patient: 'Meghna P.', type: 'OHSS Checkup', severity: 'critical' },
  ],
  18: [
    { id: 'apt-4', time: '11 AM', patient: 'Meena D.', type: 'Pre-Transfer Bloodwork', severity: 'normal' },
  ],
  21: [
    { id: 'apt-5', time: '2 PM', patient: 'Ananya S.', type: 'Beta-hCG Pregnancy Test', severity: 'critical' },
  ]
};

const MiniCalendar = ({ selectedDate, onDateSelect }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dates = Array.from({ length: 30 }, (_, i) => i + 1);
  
  return (
    <Card title="Mini Calendar" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button className="p-1 hover:bg-slate-100 rounded transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm font-bold">April 2026</span>
        <button className="p-1 hover:bg-slate-100 rounded transition-colors"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-text-secondary text-[10px] uppercase mb-1">
        {days.map((d, idx) => <span key={`day-header-${idx}`}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-medium text-[11px]">
        {/* Placeholder for first week offset */}
        {[1, 2, 3].map(i => <span key={`offset-${i}`} className="h-6"></span>)}
        {dates.map(d => (
          <span 
            key={`date-${d}`} 
            onClick={() => onDateSelect(d)}
            className={`h-7 w-7 flex items-center justify-center rounded-full cursor-pointer transition-all mx-auto ${
              d === selectedDate 
                ? 'bg-primary text-white shadow-md' 
                : 'hover:bg-primary-light hover:text-primary text-text-primary'
            }`}
          >
            {d}
          </span>
        ))}
      </div>
    </Card>
  );
};

const MainCalendar = ({ selectedDate }) => {
  const weekDays = useMemo(() => [
    { name: 'SUN', date: selectedDate - 4 },
    { name: 'MON', date: selectedDate - 3 },
    { name: 'TUE', date: selectedDate - 2 },
    { name: 'WED', date: selectedDate - 1 },
    { name: 'THU', date: selectedDate, active: true },
    { name: 'FRI', date: selectedDate + 1 },
    { name: 'SAT', date: selectedDate + 2 },
  ], [selectedDate]);

  const timeSlots = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];

  return (
    <div className="flex-1 bg-white border border-border-color rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
            <h3 className="font-bold text-lg">April 2026 — Day {selectedDate}</h3>
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['Day', 'Week', 'Month'].map((v) => (
              <button key={`btn-${v}`} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${v === 'Week' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Header Grid */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border-color sticky top-0 bg-white z-10">
          <div className="p-4 text-[10px] font-bold text-text-secondary flex items-center justify-center border-r border-border-color">TIME</div>
          {weekDays.map((d, i) => (
            <div key={`header-day-${i}`} className={`p-3 text-center border-r border-border-color ${d.active ? 'bg-primary-light/30' : ''}`}>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{d.name}</p>
              <p className={`text-xl font-black mt-1 ${d.active ? 'text-primary' : 'text-text-primary'}`}>{d.date}</p>
              {d.active && <div className="h-1 w-6 bg-primary mx-auto mt-1 rounded-full"></div>}
            </div>
          ))}
        </div>

        {/* Time Grid slots */}
        {timeSlots.map(time => (
          <div key={`row-${time}`} className="grid grid-cols-[80px_repeat(7,1fr)] h-24 border-b border-border-color">
            <div className="p-4 text-[11px] font-bold text-text-secondary border-r border-border-color flex items-start justify-center pt-4 italic uppercase tracking-tighter">
              {time}
            </div>
            {weekDays.map((d, dayIdx) => {
              const appointments = d.active ? (APPOINTMENTS_DATA[selectedDate]?.filter(apt => apt.time === time) || []) : [];
              return (
                <div key={`cell-${time}-${dayIdx}`} className={`border-r border-border-color hover:bg-slate-50 transition-colors relative ${d.active ? 'bg-slate-50/30' : ''}`}>
                  {appointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className={`absolute inset-2 border-l-4 rounded-md p-2 shadow-sm animate-in fade-in zoom-in duration-300 ${
                        apt.severity === 'critical' 
                          ? 'bg-red-50 border-red-500 text-red-700' 
                          : 'bg-yellow-50 border-yellow-400 text-yellow-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold truncate">{apt.patient}</p>
                        <Badge variant={apt.severity === 'critical' ? 'critical' : 'moderate'} className="text-[8px] py-0 px-1">
                          {apt.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[10px] mt-1 opacity-80">{apt.type}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const Nurse = () => {
  const [selectedDate, setSelectedDate] = useState(16);

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] animate-in fade-in">
      <div className="w-[280px] shrink-0">
        <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        <div className="mt-6 p-4 bg-white border border-border-color rounded-xl shadow-sm">
          <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[12px] font-semibold text-text-primary">Critical Case</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-[12px] font-semibold text-text-primary">Normal / Stable</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <MainCalendar selectedDate={selectedDate} />
      </div>
    </div>
  );
};

export default Nurse;
