import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  LogOut, 
  Search, 
  ChevronDown,
  MessageCircle,
  FileText
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const navItems = [
    { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
    { name: 'Appointments', path: '/cro', icon: Calendar },
    { name: 'Patients', path: '/frontdesk', icon: Users },
    { name: 'Patient Summaries', path: '/summaries', icon: FileText },
    { name: 'Messaging', path: '/messaging', icon: MessageCircle },
  ];

  return (
    <aside className="w-[280px] h-screen bg-white border-r border-border-color fixed left-0 top-0 flex flex-col">
      <div className="p-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">J</div>
          <div>
            <h1 className="text-[15px] font-bold text-text-primary leading-none">JanmaSethu</h1>
            <p className="text-[10px] text-text-secondary font-medium tracking-tight mt-1 uppercase">Clinical OS V2.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : 'hover:bg-slate-50'}`
            }
          >
            <item.icon size={18} />
            <span className="text-[13px] font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border-color">
        <button 
          onClick={() => navigate('/')}
          className="nav-item w-full hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-[13px] font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const TopBar = () => {
  return (
    <header className="h-[56px] bg-white border-b border-border-color flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="relative w-[400px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
        <input 
          type="text" 
          placeholder="Global Search (Patients, Leads...)" 
          className="input-search"
        />
      </div>

      <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
        <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">ST</div>
        <div className="text-left">
          <p className="text-[13px] font-bold text-text-primary leading-none">Clinical Staff</p>
          <p className="text-[11px] text-text-secondary font-medium mt-0.5">JanmaSethu Terminal</p>
        </div>
        <ChevronDown size={14} className="text-text-secondary ml-1" />
      </div>
    </header>
  );
};

const Shell = () => {
  return (
    <div className="min-h-screen bg-bg-page flex">
      <Sidebar />
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Floating Chat Bubble */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50">
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default Shell;
