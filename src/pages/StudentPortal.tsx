import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, BookOpen, User, Bell, LogOut, ChevronDown, Calendar, AlertCircle, Clock, FileText } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

export default function StudentPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login/student');
      return;
    }

    fetch('/api/student/dashboard', {
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
        navigate('/login/student');
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        className="w-72 h-full glass-panel border-r border-white/10 flex flex-col z-20 absolute md:relative"
      >
        <div className="p-6 flex items-center gap-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold">
            {data?.student?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{data.student.name}</h3>
            <p className="text-sm text-blue-300">{data.student.roll_number}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarLink to="/student" icon={<LayoutDashboard />} label="Dashboard" active={location.pathname === '/student'} />
          <SidebarLink to="/student/bio" icon={<User />} label="Bio Data" active={location.pathname === '/student/bio'} />
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Academics</p>
          </div>
          
          {data.semesters.map((sem: any) => (
            <SidebarLink 
              key={sem.semester_number}
              to={`/student/semester/${sem.semester_number}`} 
              icon={<BookOpen size={18} />} 
              label={`Semester ${sem.semester_number}`} 
              active={location.pathname === `/student/semester/${sem.semester_number}`} 
            />
          ))}

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Updates</p>
          </div>
          <SidebarLink to="/student/announcements" icon={<Bell />} label="Announcements" active={location.pathname === '/student/announcements'} />
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
            <Route path="/" element={<DashboardView data={data} />} />
            <Route path="/bio" element={<BioDataView student={data.student} />} />
            <Route path="/semester/:num" element={<SemesterView />} />
            <Route path="*" element={<DashboardView data={data} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean; key?: React.Key }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all ${
        active ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function DashboardView({ data }: { data: any }) {
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timetable' | 'syllabus' | null>(null);

  // Generate last 30 days for heatmap
  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(new Date(), 29 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const record = data.attendance.find((a: any) => a.date === dateStr);
    return { date: d, dateStr, record };
  });

  const getHeatmapColor = (attended: number) => {
    if (attended === 0) return 'bg-red-500/80';
    if (attended <= 2) return 'bg-emerald-400/40';
    if (attended <= 4) return 'bg-emerald-500/70';
    return 'bg-emerald-600';
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
            Student Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Welcome back, {data?.student?.name?.split(' ')[0] || ''}</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-6 py-3 text-center">
            <p className="text-sm text-gray-400">CGPA</p>
            <p className="text-2xl font-bold text-blue-300">{data.student.cgpa}</p>
          </div>
          <div className="glass-card px-6 py-3 text-center">
            <p className="text-sm text-gray-400">Rank</p>
            <p className="text-2xl font-bold text-purple-300">#{data.student.rank}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Section */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="text-blue-400" /> Attendance Heatmap
            </h2>
            <div className={`px-4 py-1 rounded-full text-sm font-semibold ${data.student.total_attendance_percent < 75 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
              {data.student.total_attendance_percent.toFixed(1)}% Total
            </div>
          </div>
          
          {data.student.total_attendance_percent < 75 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300">
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <p className="text-sm">Warning: Your attendance is below the required 75% threshold. Please meet your HOD immediately.</p>
            </div>
          )}

          <div className="grid grid-cols-10 gap-2 mb-4">
            {days.map((day, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square rounded-md border border-white/5 transition-colors ${
                  day.record ? getHeatmapColor(day.record.periods_attended) : 'bg-white/5'
                }`}
                title={format(day.date, 'MMM dd')}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-end gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500/80" /> 0</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-400/40" /> 1-2</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500/70" /> 3-4</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-600" /> 5+</span>
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Bell className="text-purple-400" /> Upcoming Exams
          </h2>
          <div className="space-y-4">
            {data.upcomingExams.map((exam: any) => {
              const daysLeft = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              return (
                <div key={exam.id} className="glass-card p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{exam.subject}</p>
                    <p className="text-sm text-gray-400">{format(parseISO(exam.date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-300">{daysLeft}</p>
                    <p className="text-xs text-gray-400">days left</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions / Info Tabs */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <button 
            onClick={() => setActiveTab(activeTab === 'timetable' ? null : 'timetable')}
            className={`glass-panel p-6 flex flex-col items-center justify-center gap-3 transition-all ${activeTab === 'timetable' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-white/5'}`}
          >
            <Clock className="text-blue-400" size={32} />
            <span className="font-semibold text-lg">Time Table</span>
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === 'syllabus' ? null : 'syllabus')}
            className={`glass-panel p-6 flex flex-col items-center justify-center gap-3 transition-all ${activeTab === 'syllabus' ? 'ring-2 ring-purple-500 bg-purple-500/10' : 'hover:bg-white/5'}`}
          >
            <FileText className="text-purple-400" size={32} />
            <span className="font-semibold text-lg">Syllabus</span>
          </button>
        </div>

        {/* Expanded Tab Content */}
        <AnimatePresence>
          {activeTab && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:col-span-3 glass-panel overflow-hidden"
            >
              <div className="p-6">
                {activeTab === 'timetable' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Clock className="text-blue-400" /> Current Semester Time Table
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-sm">
                            <th className="pb-3 font-medium">Day</th>
                            <th className="pb-3 font-medium">9:00 - 10:00</th>
                            <th className="pb-3 font-medium">10:00 - 11:00</th>
                            <th className="pb-3 font-medium">11:15 - 12:15</th>
                            <th className="pb-3 font-medium">1:00 - 2:00</th>
                            <th className="pb-3 font-medium">2:00 - 3:00</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                            <tr key={day} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-4 font-medium text-blue-300">{day}</td>
                              <td className="py-4">Data Structures</td>
                              <td className="py-4">Operating Systems</td>
                              <td className="py-4">Computer Networks</td>
                              <td className="py-4">Database Systems</td>
                              <td className="py-4">Lab</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === 'syllabus' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <FileText className="text-purple-400" /> Current Semester Syllabus
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['Data Structures', 'Operating Systems', 'Computer Networks', 'Database Systems', 'Lab'].map(sub => (
                        <div key={sub} className="glass-card p-4">
                          <h3 className="font-semibold text-lg mb-2 text-purple-300">{sub}</h3>
                          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                            <li>Unit 1: Introduction & Basics</li>
                            <li>Unit 2: Core Concepts & Algorithms</li>
                            <li>Unit 3: Advanced Topics</li>
                            <li>Unit 4: Practical Implementations</li>
                            <li>Unit 5: Case Studies</li>
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Internal Exams */}
        <div className="lg:col-span-3 glass-panel p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <BookOpen className="text-indigo-400" /> Current Semester Internals
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium text-center">Int 1 (20)</th>
                  <th className="pb-3 font-medium text-center">Int 2 (20)</th>
                  <th className="pb-3 font-medium text-center">Avg (20)</th>
                  <th className="pb-3 font-medium text-center">Assign (10)</th>
                  <th className="pb-3 font-medium text-center">Total Int (30)</th>
                  <th className="pb-3 font-medium text-center">External (70)</th>
                  <th className="pb-3 font-medium text-right">Final (100)</th>
                </tr>
              </thead>
              <tbody>
                {data.internalExams.map((exam: any) => {
                  const avgInternal = Math.round((exam.internal_1 + exam.internal_2) / 2);
                  const totalInternal = avgInternal + (exam.assignment_marks || 0);
                  const finalTotal = totalInternal + exam.external;
                  return (
                    <tr key={exam.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 font-medium">{exam.subject}</td>
                      <td className="py-4 text-center">{exam.internal_1}</td>
                      <td className="py-4 text-center">{exam.internal_2}</td>
                      <td className="py-4 text-center text-gray-300">{avgInternal}</td>
                      <td className="py-4 text-center">{exam.assignment_marks || 0}</td>
                      <td className="py-4 text-center font-semibold text-blue-300">{totalInternal}</td>
                      <td className="py-4 text-center">{exam.external}</td>
                      <td className="py-4 text-right font-bold text-purple-300">{finalTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-8 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-2">{format(selectedDate.date, 'MMMM dd, yyyy')}</h3>
              
              {selectedDate.record ? (
                <div className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 text-center">
                      <p className="text-sm text-gray-400">Conducted</p>
                      <p className="text-2xl font-bold">{selectedDate.record.periods_conducted}</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <p className="text-sm text-gray-400">Attended</p>
                      <p className="text-2xl font-bold text-blue-400">{selectedDate.record.periods_attended}</p>
                    </div>
                  </div>
                  
                  {selectedDate.record.periods_attended === 0 ? (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-center text-red-300">
                      Absent for all periods on this day.
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-300">Subject Breakdown</h4>
                      <div className="space-y-2">
                        {Object.entries(JSON.parse(selectedDate.record.subject_breakdown)).map(([sub, attended]: any) => (
                          <div key={sub} className="flex justify-between items-center p-3 glass-card">
                            <span>{sub}</span>
                            <span className={attended ? 'text-green-400' : 'text-red-400'}>
                              {attended ? 'Present' : 'Absent'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 mt-4">No attendance records for this date.</p>
              )}
              
              <button
                onClick={() => setSelectedDate(null)}
                className="mt-8 w-full glass-button py-3 font-semibold"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BioDataView({ student }: { student: any }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
        Bio Data
      </h1>
      
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-5xl font-bold shadow-xl shrink-0">
            {student?.name?.charAt(0) || 'U'}
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <InfoItem label="Full Name" value={student.name} />
            <InfoItem label="Roll Number" value={student.roll_number} />
            <InfoItem label="Department" value={student.department} />
            <InfoItem label="Admission Year" value={student.admission_year} />
            <InfoItem label="Date of Birth" value={student.dob} />
            <InfoItem label="Contact Info" value={student.contact_info} />
            <InfoItem label="Parent Details" value={student.parent_details} className="md:col-span-2" />
            <InfoItem label="Address" value={student.address} className="md:col-span-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="font-medium text-lg">{value}</p>
    </div>
  );
}

function SemesterView() {
  const { num } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/student/semester/${num}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [num]);

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
        Semester {num} Overview
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-gray-400">SGPA</p>
          <p className="text-3xl font-bold text-blue-300 mt-2">{data.semester.sgpa.toFixed(2)}</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-gray-400">Rank</p>
          <p className="text-3xl font-bold text-purple-300 mt-2">#{data.semester.rank}</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-gray-400">Attendance</p>
          <p className="text-3xl font-bold text-emerald-300 mt-2">{data.semester.attendance_percent.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-gray-400">Backlogs</p>
          <p className="text-3xl font-bold text-red-300 mt-2">{data.semester.backlogs}</p>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-6">Subject Marks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium text-center">Int 1</th>
                <th className="pb-3 font-medium text-center">Int 2</th>
                <th className="pb-3 font-medium text-center">Assign</th>
                <th className="pb-3 font-medium text-center">External</th>
                <th className="pb-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.internalExams.map((exam: any) => {
                const avgInternal = Math.round((exam.internal_1 + exam.internal_2) / 2);
                const totalInternal = avgInternal + (exam.assignment_marks || 0);
                const total = totalInternal + exam.external;
                return (
                  <tr key={exam.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium">{exam.subject}</td>
                    <td className="py-4 text-center">{exam.internal_1}</td>
                    <td className="py-4 text-center">{exam.internal_2}</td>
                    <td className="py-4 text-center">{exam.assignment_marks || 0}</td>
                    <td className="py-4 text-center">{exam.external}</td>
                    <td className="py-4 text-right font-bold text-blue-300">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
