import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Users, GraduationCap, AlertTriangle, LogOut, Search, Send, Activity, DollarSign, BookOpen, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { GoogleGenAI } from '@google/genai';

export default function AdminPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login/admin');
      return;
    }

    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login/admin');
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-72 h-full glass-panel border-r border-white/10 flex flex-col z-20"
      >
        <div className="p-6 flex items-center gap-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center text-xl font-bold">
            A
          </div>
          <div>
            <h3 className="font-semibold text-lg">Administrator</h3>
            <p className="text-sm text-red-300">System Control</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarLink to="/admin" icon={<LayoutDashboard />} label="AI Dashboard" active={location.pathname === '/admin'} color="red" />
          <SidebarLink to="/admin/students" icon={<GraduationCap />} label="Students" active={location.pathname === '/admin/students'} color="blue" />
          <SidebarLink to="/admin/staff" icon={<Users />} label="Staff" active={location.pathname === '/admin/staff'} color="purple" />
          <SidebarLink to="/admin/danger" icon={<AlertTriangle />} label="Danger Zone" active={location.pathname === '/admin/danger'} color="orange" />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<AIDashboardView data={data} />} />
            <Route path="/students" element={<StudentsView />} />
            <Route path="/staff" element={<StaffView />} />
            <Route path="/danger" element={<DangerZoneView />} />
            <Route path="*" element={<AIDashboardView data={data} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label, active, color }: { to: string; icon: React.ReactNode; label: string; active: boolean; color: string }) {
  const navigate = useNavigate();
  const colorClasses: Record<string, string> = {
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  };

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all border border-transparent ${
        active ? colorClasses[color] : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function AIDashboardView({ data }: { data: any }) {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [response, setResponse] = useState<{ text: string; confidence?: number } | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const prompts = [
    "Who has highest attendance?",
    "Show CSE students with CGPA above 8",
    "Total fee collected this month?",
    "Who is the highest paid staff?",
    "Students below 75% attendance"
  ];

  useEffect(() => {
    let currentIndex = 0;
    let currentText = '';
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const fullText = prompts[currentIndex];
      
      if (isDeleting) {
        currentText = fullText.substring(0, currentText.length - 1);
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
      }

      setPlaceholder(currentText);

      let typeSpeed = isDeleting ? 30 : 100;

      if (!isDeleting && currentText === fullText) {
        typeSpeed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && currentText === '') {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % prompts.length;
        typeSpeed = 500; // Pause before next word
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    timeoutId = setTimeout(type, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsTyping(true);
    setResponse(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });
      const result = await res.json();
      if (res.ok) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: query,
            config: {
              systemInstruction: result.context,
            }
          });
          setResponse({ text: aiResponse.text || 'No response generated.', confidence: result.confidence });
        } catch (aiError: any) {
          console.error('Gemini AI error:', aiError);
          if (aiError?.message?.includes('API key not valid')) {
            if (process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
              setResponse({ text: 'You have entered the placeholder "MY_GEMINI_API_KEY" in your Secrets panel. Please delete it to use the free key, or enter a real API key.' });
            } else {
              setResponse({ text: 'The provided Gemini API key is invalid. Please check your Secrets panel configuration.' });
            }
          } else {
            setResponse({ text: 'Error generating AI response.' });
          }
        }
      } else {
        setResponse({ text: result.error || 'Error processing query.' });
      }
    } catch (error) {
      setResponse({ text: 'Network error occurred.' });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
          Campus AI Assistant
        </h1>
        <p className="text-gray-400 text-lg">Ask anything about your campus data</p>
      </div>

      {/* AI Input Box */}
      <div className="max-w-4xl mx-auto relative group mt-8">
        <div className="absolute -inset-2 bg-gradient-to-r from-red-500 via-orange-500 to-purple-500 rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
        <form onSubmit={handleQuery} className="relative flex items-center bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <Search className="absolute left-6 text-gray-400" size={28} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent py-8 pl-20 pr-20 text-2xl text-white outline-none placeholder:text-gray-500 font-light tracking-wide"
          />
          <button 
            type="submit" 
            disabled={isTyping || !query.trim()}
            className="absolute right-4 p-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-xl transition-all shadow-lg hover:shadow-red-500/25"
          >
            <Send size={24} />
          </button>
        </form>
      </div>

      {/* AI Response Area */}
      <AnimatePresence>
        {(isTyping || response) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto glass-panel p-6 border border-red-500/20"
          >
            {isTyping ? (
              <div className="flex items-center gap-3 text-red-400">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Analyzing campus data...</span>
              </div>
            ) : response && (
              <div className="space-y-4">
                <p className="text-lg leading-relaxed">{response.text}</p>
                {response.confidence && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">AI Confidence:</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[200px]">
                      <div 
                        className={`h-full ${response.confidence > 80 ? 'bg-green-500' : response.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${response.confidence}%` }}
                      />
                    </div>
                    <span className={response.confidence > 80 ? 'text-green-400' : response.confidence > 60 ? 'text-yellow-400' : 'text-red-400'}>
                      {response.confidence}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        <StatCard title="Total Students" value={data?.stats?.totalStudents || 0} icon={<GraduationCap />} color="blue" />
        <StatCard title="Total Staff" value={data?.stats?.totalStaff || 0} icon={<Users />} color="purple" />
        <StatCard title="Avg Attendance" value={`${data?.stats?.avgAttendance || 0}%`} icon={<Activity />} color="emerald" />
        <StatCard title="Total Fees Collected" value={`$${(data?.stats?.totalFees || 0).toLocaleString()}`} icon={<DollarSign />} color="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="glass-panel p-6 h-80">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Department Distribution</h3>
          <ResponsiveContainer width="full" height="100%">
            <BarChart data={[
              { name: 'CSE', students: 450 },
              { name: 'ECE', students: 300 },
              { name: 'MECH', students: 250 },
              { name: 'CIVIL', students: 150 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff50" />
              <YAxis stroke="#ffffff50" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff20' }} />
              <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-panel p-6 h-80">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Fee Collection Status</h3>
          <ResponsiveContainer width="full" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Paid', value: 75 },
                  { name: 'Pending', value: 25 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff20' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`glass-panel p-6 border ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 font-medium">{title}</h3>
        <div className={`p-2 rounded-lg ${colorMap[color].split(' ')[1]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </motion.div>
  );
}

function StudentsView() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setStudents(await res.json());
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchStudents();
    }
  };

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="glass-panel p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <button className="glass-button px-4 py-2">Add Student</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Roll Number</th>
              <th className="pb-3 font-medium">Department</th>
              <th className="pb-3 font-medium">CGPA</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 font-medium">{student.name}</td>
                <td className="py-4 text-gray-300">{student.roll_number}</td>
                <td className="py-4 text-gray-300">{student.department}</td>
                <td className="py-4 text-blue-300 font-semibold">{student.cgpa}</td>
                <td className="py-4 text-right">
                  <button onClick={() => handleDelete(student.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaffView() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/staff', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setStaff(await res.json());
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchStaff();
    }
  };

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="glass-panel p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <button className="glass-button px-4 py-2">Add Staff</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Position</th>
              <th className="pb-3 font-medium">Department</th>
              <th className="pb-3 font-medium">Salary</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 font-medium">{member.name}</td>
                <td className="py-4 text-gray-300">{member.position}</td>
                <td className="py-4 text-gray-300">{member.department}</td>
                <td className="py-4 text-green-400 font-semibold">${member.salary.toLocaleString()}</td>
                <td className="py-4 text-right">
                  <button onClick={() => handleDelete(member.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DangerZoneView() {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReset = async () => {
    if (confirmText !== 'CONFIRM RESET') return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        alert('System data has been erased successfully.');
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset system.');
      }
    } catch (e) {
      alert('Network error.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-panel p-8 border border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-4 mb-6 text-red-400">
          <AlertTriangle size={32} />
          <h2 className="text-2xl font-bold">Danger Zone</h2>
        </div>
        
        <p className="text-gray-300 mb-6">
          This action will permanently erase all student, staff, attendance, and financial data from the system. The admin account will be preserved. This action cannot be undone.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type "CONFIRM RESET" to proceed</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="CONFIRM RESET"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-red-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            onClick={handleReset}
            disabled={confirmText !== 'CONFIRM RESET' || !password || isDeleting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:text-gray-500 text-white font-bold rounded-xl transition-colors mt-4"
          >
            {isDeleting ? 'ERASING DATA...' : 'ERASE ALL DATA'}
          </button>
        </div>
      </div>
    </div>
  );
}
