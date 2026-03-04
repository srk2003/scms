import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import StudentPortal from './pages/StudentPortal';
import StaffPortal from './pages/StaffPortal';
import AdminPortal from './pages/AdminPortal';
import Chatbot from './components/Chatbot';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/student/*" element={<StudentPortal />} />
        <Route path="/staff/*" element={<StaffPortal />} />
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Chatbot />
    </Router>
  );
}
