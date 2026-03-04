import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, BookOpen, User, Bell, LogOut, Calendar, Users, TrendingUp, CheckSquare } from 'lucide-react';

export default function StaffPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login/staff');
      return;
    }

    fetch('/api/staff/dashboard', {
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
        navigate('/login/staff');
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-72 h-full glass-panel border-r border-white/10 flex flex-col z-20 absolute md:relative"
      >
        <div className="p-6 flex items-center gap-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold">
            {data?.staff?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{data.staff.name}</h3>
            <p className="text-sm text-purple-300">{data.staff.position}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarLink to="/staff" icon={<LayoutDashboard />} label="Dashboard" active={location.pathname === '/staff'} />
          <SidebarLink to="/staff/bio" icon={<User />} label="Bio Data" active={location.pathname === '/staff/bio'} />
          <SidebarLink to="/staff/academic-years" icon={<BookOpen />} label="Previous Academic Year Data" active={location.pathname === '/staff/academic-years'} />
          <SidebarLink to="/staff/subjects" icon={<BookOpen />} label="My Subjects" active={location.pathname === '/staff/subjects'} />
          <SidebarLink to="/staff/schedule" icon={<Calendar />} label="Today's Schedule" active={location.pathname === '/staff/schedule'} />
          <SidebarLink to="/staff/attendance" icon={<CheckSquare />} label="Student Attendance Management" active={location.pathname === '/staff/attendance'} />
          <SidebarLink to="/staff/performance" icon={<TrendingUp />} label="Performance Dashboard" active={location.pathname === '/staff/performance'} />
          <SidebarLink to="/staff/announcements" icon={<Bell />} label="Announcements" active={location.pathname === '/staff/announcements'} />
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
            <Route path="/bio" element={<BioDataView staff={data.staff} />} />
            <Route path="/academic-years" element={<AcademicYearsView years={data.academicYears} />} />
            <Route path="/subjects" element={<SubjectsView subjects={data.subjects} />} />
            <Route path="/schedule" element={<ScheduleView schedule={data.schedule} />} />
            <Route path="/attendance" element={<AttendanceManagementView />} />
            <Route path="/performance" element={<PerformanceView performance={data.performance} />} />
            <Route path="*" element={<DashboardView data={data} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all ${
        active ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium text-left">{label}</span>
    </button>
  );
}

function DashboardView({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
            Staff Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Welcome back, {data?.staff?.name?.split(' ')[0] || ''}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-300">
            <Calendar /> Today's Schedule
          </h2>
          {data.schedule.length === 0 ? (
            <p className="text-gray-400 italic">No periods scheduled today.</p>
          ) : (
            <div className="space-y-4">
              {data.schedule.map((s: any) => (
                <div key={s.id} className="glass-card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs font-bold">
                      Period {s.period_number}
                    </span>
                    <span className="text-sm text-gray-400">{s.time}</span>
                  </div>
                  <p className="font-medium text-lg">{s.subject}</p>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{s.class_name}</span>
                    <span>{s.room}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-pink-300">
            <TrendingUp /> Performance Snapshot
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-gray-400">Class Avg Attendance</p>
              <p className="text-3xl font-bold text-emerald-400 mt-2">{data.performance.classAvgAttendance}%</p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-gray-400">Avg Internal Marks</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{data.performance.avgInternalMarks}/40</p>
            </div>
          </div>

          <h3 className="font-medium text-gray-300 mb-4">Top Performing Students</h3>
          <div className="space-y-3">
            {data.performance.topStudents.map((s: any, i: number) => (
              <div key={i} className="glass-card p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-purple-300">
                    {i + 1}
                  </div>
                  <span className="font-medium">{s.name}</span>
                </div>
                <span className="text-blue-300 font-bold">{s.cgpa} CGPA</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BioDataView({ staff }: { staff: any }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
        Staff Bio Data
      </h1>
      
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-5xl font-bold shadow-xl shrink-0">
            {staff?.name?.charAt(0) || 'U'}
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <InfoItem label="Full Name" value={staff.name} />
            <InfoItem label="Position" value={staff.position} />
            <InfoItem label="Department" value={staff.department} />
            <InfoItem label="Qualification" value={staff.qualification} />
            <InfoItem label="Experience" value={`${staff.experience_years} Years`} />
            <InfoItem label="Joining Date" value={staff.joining_date} />
            <InfoItem label="Salary" value={`$${staff.salary.toLocaleString()}`} />
            <InfoItem label="Contact Info" value={staff.contact_info} />
            <InfoItem label="Achievements" value={staff.achievements} className="md:col-span-2" />
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

function AcademicYearsView({ years }: { years: any[] }) {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
        Previous Academic Year Data
      </h1>
      
      <div className="space-y-6">
        {years.map(year => (
          <div key={year.id} className="glass-panel p-6">
            <h2 className="text-2xl font-bold mb-6 text-purple-300 border-b border-white/10 pb-4">
              Academic Year {year.academic_year}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-gray-400">Pass %</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{year.pass_percentage}%</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-gray-400">Avg Attendance</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{year.avg_attendance}%</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-gray-400">Avg Internals</p>
                <p className="text-2xl font-bold text-pink-400 mt-1">{year.avg_internal_marks}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-gray-400">Students Handled</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{year.students_handled}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400 mb-2">Subjects Taught</p>
                <p className="font-medium">{year.subjects_taught}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400 mb-2">Major Achievements</p>
                <p className="font-medium text-yellow-300">{year.achievements}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectsView({ subjects }: { subjects: any[] }) {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
        My Subjects
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map(sub => (
          <div key={sub.id} className="glass-panel p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{sub.subject}</h2>
                <p className="text-purple-300 mt-1">Semester {sub.semester}</p>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-xl text-center">
                <p className="text-xs text-gray-400">Students</p>
                <p className="font-bold text-xl">{sub.total_students}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400">Avg Attendance</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{sub.avg_attendance}%</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400">Avg Internals</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{sub.avg_internal_marks}/40</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleView({ schedule }: { schedule: any[] }) {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
        Today's Schedule
      </h1>
      
      <div className="glass-panel p-6">
        {schedule.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">No periods scheduled today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="pb-3 font-medium">Period</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Class</th>
                  <th className="pb-3 font-medium">Room</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((s: any) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm font-bold">
                        {s.period_number}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">{s.time}</td>
                    <td className="py-4 font-medium text-white">{s.subject}</td>
                    <td className="py-4 text-blue-300">{s.class_name}</td>
                    <td className="py-4 text-gray-300">{s.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceManagementView() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [className, setClassName] = useState('CS-A');
  const [periods, setPeriods] = useState(1);
  const [students, setStudents] = useState([
    { id: 1, name: 'Student Name 1', roll: 'ROLL202301', attended: 1 },
    { id: 2, name: 'Student Name 2', roll: 'ROLL202302', attended: 1 },
    { id: 3, name: 'Student Name 3', roll: 'ROLL202303', attended: 1 },
  ]);

  const handleSave = async () => {
    // Mock save
    alert('Attendance saved successfully!');
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
        Attendance Management
      </h1>
      
      <div className="glass-panel p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Class</label>
            <select 
              value={className} 
              onChange={e => setClassName(e.target.value)}
              className="glass-input w-full appearance-none"
            >
              <option value="CS-A" className="bg-slate-800">CS-A</option>
              <option value="CS-B" className="bg-slate-800">CS-B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Periods Conducted</label>
            <input 
              type="number" 
              min="1" max="5"
              value={periods} 
              onChange={e => setPeriods(parseInt(e.target.value))}
              className="glass-input w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="pb-3 font-medium">Roll Number</th>
                <th className="pb-3 font-medium">Student Name</th>
                <th className="pb-3 font-medium text-center">Periods Attended</th>
                <th className="pb-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-gray-300">{s.roll}</td>
                  <td className="py-4 font-medium">{s.name}</td>
                  <td className="py-4 text-center">
                    <input 
                      type="number" 
                      min="0" max={periods}
                      value={s.attended}
                      onChange={e => {
                        const newStudents = [...students];
                        newStudents[i].attended = parseInt(e.target.value);
                        setStudents(newStudents);
                      }}
                      className="glass-input w-20 text-center"
                    />
                  </td>
                  <td className="py-4 text-center">
                    {s.attended === 0 ? (
                      <span className="text-red-400 font-medium">Absent</span>
                    ) : s.attended === periods ? (
                      <span className="text-emerald-400 font-medium">Present</span>
                    ) : (
                      <span className="text-yellow-400 font-medium">Partial</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} className="glass-button px-8 py-3 font-semibold text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

function PerformanceView({ performance }: { performance: any }) {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
        Performance Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-6 text-purple-300 border-b border-white/10 pb-4">
            Top 3 Students
          </h2>
          <div className="space-y-4">
            {performance.topStudents.map((s: any, i: number) => (
              <div key={i} className="glass-card p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' :
                    i === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' :
                    'bg-amber-700/20 text-amber-500 border border-amber-700/50'
                  }`}>
                    #{i + 1}
                  </div>
                  <span className="font-medium text-lg">{s.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-blue-300 font-bold text-xl">{s.cgpa}</span>
                  <p className="text-xs text-gray-400">CGPA</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-6 text-red-400 border-b border-white/10 pb-4">
            Students Below 75% Attendance
          </h2>
          <div className="space-y-4">
            {performance.below75.length === 0 ? (
              <p className="text-gray-400 italic">All students have good attendance.</p>
            ) : (
              performance.below75.map((s: any, i: number) => (
                <div key={i} className="glass-card p-4 flex justify-between items-center border-red-500/30 bg-red-500/5">
                  <span className="font-medium text-lg">{s.name}</span>
                  <div className="text-right">
                    <span className="text-red-400 font-bold text-xl">{s.total_attendance_percent.toFixed(1)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
