import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import FrontDesk from './pages/FrontDesk';
import Nurse from './pages/Nurse';
import Doctor from './pages/Doctor';
import DoctorOnboarding from './pages/DoctorOnboarding';
import PatientSummaries from './pages/PatientSummaries';
import DoctorMessaging from './pages/DoctorMessaging';
import NurseMessaging from './pages/NurseMessaging';

import Login from './pages/Login';
import DigitalTwin from './pages/DigitalTwin';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/doctor/onboarding" element={<DoctorOnboarding />} />
        <Route element={<Shell />}>
          <Route path="frontdesk" element={<FrontDesk />} />
          <Route path="cro" element={<Nurse />} />
          <Route path="doctor" element={<Doctor />} />
          <Route path="summaries" element={<PatientSummaries />} />
          <Route path="messaging" element={<Messaging />} />
          <Route path="twin" element={<DigitalTwin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
