import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db, { initDb } from './server/db.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'super_secret_jwt_key_for_erp';

app.use(express.json());

// Initialize DB
initDb();

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.get('/api/check-env', (req, res) => {
  res.json({ 
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    keyValue: process.env.GEMINI_API_KEY,
    hasApiKey: !!process.env.API_KEY,
    nextPubKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    envKeys: Object.keys(process.env).filter(k => k.includes('API') || k.includes('GEMINI'))
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(username, role) as any;
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Student Routes
app.get('/api/student/dashboard', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'student') return res.sendStatus(403);
  
  const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
  const attendance = db.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30').all(req.user.id);
  const internalExams = db.prepare('SELECT * FROM internal_exams WHERE student_id = ?').all(req.user.id);
  const upcomingExams = db.prepare('SELECT * FROM upcoming_exams ORDER BY date ASC').all();
  const semesters = db.prepare('SELECT * FROM semesters WHERE student_id = ? ORDER BY semester_number ASC').all(req.user.id);

  res.json({ student, attendance, internalExams, upcomingExams, semesters });
});

app.get('/api/student/semester/:num', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'student') return res.sendStatus(403);
  const semester = db.prepare('SELECT * FROM semesters WHERE student_id = ? AND semester_number = ?').get(req.user.id, req.params.num);
  const internalExams = db.prepare('SELECT * FROM internal_exams WHERE student_id = ? AND semester = ?').all(req.user.id, req.params.num);
  res.json({ semester, internalExams });
});

// Staff Routes
app.get('/api/staff/dashboard', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'staff') return res.sendStatus(403);
  
  const staff = db.prepare('SELECT * FROM staff WHERE user_id = ?').get(req.user.id);
  const academicYears = db.prepare('SELECT * FROM staff_academic_years WHERE staff_id = ? ORDER BY academic_year DESC').all(req.user.id);
  const subjects = db.prepare('SELECT * FROM staff_subjects WHERE staff_id = ?').all(req.user.id);
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const schedule = db.prepare('SELECT * FROM staff_schedule WHERE staff_id = ? AND day_of_week = ? ORDER BY period_number ASC').all(req.user.id, today);

  // Performance Dashboard data
  const performance = {
    classAvgAttendance: 85.5,
    topStudents: db.prepare('SELECT name, cgpa FROM students JOIN users ON students.user_id = users.id ORDER BY cgpa DESC LIMIT 3').all(),
    below75: db.prepare('SELECT name, total_attendance_percent FROM students JOIN users ON students.user_id = users.id WHERE total_attendance_percent < 75').all(),
    avgInternalMarks: 34.2,
    teachingLoad: schedule.length
  };

  res.json({ staff, academicYears, subjects, schedule, performance });
});

app.post('/api/staff/attendance', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'staff') return res.sendStatus(403);
  const { class_name, date, periods_conducted, students } = req.body;
  
  const insertAttendance = db.prepare('INSERT INTO attendance (student_id, date, periods_conducted, periods_attended, subject_breakdown) VALUES (?, ?, ?, ?, ?)');
  
  db.transaction(() => {
    for (const student of students) {
      insertAttendance.run(student.id, date, periods_conducted, student.periods_attended, JSON.stringify(student.breakdown));
    }
  })();
  
  res.json({ success: true });
});

// Admin Routes
app.get('/api/admin/dashboard', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get() as any;
  const totalStaff = db.prepare('SELECT COUNT(*) as count FROM staff').get() as any;
  const avgAttendance = db.prepare('SELECT AVG(total_attendance_percent) as avg FROM students').get() as any;
  const totalFees = db.prepare('SELECT SUM(paid_amount) as total FROM fees').get() as any;

  res.json({
    stats: {
      totalStudents: totalStudents.count,
      totalStaff: totalStaff.count,
      avgAttendance: avgAttendance.avg ? avgAttendance.avg.toFixed(1) : 0,
      totalFees: totalFees.total || 0
    }
  });
});

app.post('/api/admin/smart-query', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  try {
    const { query } = req.body;
    
    // Fetch context data for the AI to answer admin queries
    const studentsData = db.prepare('SELECT name, roll_number, department, cgpa, total_attendance_percent FROM students JOIN users ON students.user_id = users.id').all();
    const staffData = db.prepare('SELECT name, department, salary, position FROM staff JOIN users ON staff.user_id = users.id').all();
    const feesData = db.prepare('SELECT name, total_amount, paid_amount FROM fees JOIN users ON fees.student_id = users.id').all();

    const context = `
      You are the "Campus AI Assistant", an intelligent engine for a College ERP system.
      You are talking to the System Administrator.
      You must answer their query based on the following database context.
      
      Students Data: ${JSON.stringify(studentsData)}
      Staff Data: ${JSON.stringify(staffData)}
      Fees Data: ${JSON.stringify(feesData)}
      
      Respond with a clear, concise, structured English sentence.
      Do not expose raw SQL or internal IDs.
      If the query cannot be answered with the provided data, say so politely.
    `;

    // Log the query
    const insertLog = db.prepare('INSERT INTO ai_query_logs (user_id, query_text, intent, confidence, success) VALUES (?, ?, ?, ?, ?)');
    insertLog.run(req.user.id, query, 'admin_query', 92.5, 1); // Mock confidence

    res.json({ context, confidence: 92.5 });
  } catch (error: any) {
    console.error('Admin AI error:', error);
    res.status(500).json({ error: 'Failed to process AI query context.' });
  }
});

// Admin Student CRUD
app.get('/api/admin/students', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const students = db.prepare('SELECT users.id, users.username, users.name, students.roll_number, students.department, students.cgpa FROM users JOIN students ON users.id = students.user_id').all();
  res.json(students);
});

app.delete('/api/admin/students/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM attendance WHERE student_id = ?').run(req.params.id);
      db.prepare('DELETE FROM internal_exams WHERE student_id = ?').run(req.params.id);
      db.prepare('DELETE FROM semesters WHERE student_id = ?').run(req.params.id);
      db.prepare('DELETE FROM fees WHERE student_id = ?').run(req.params.id);
      db.prepare('DELETE FROM students WHERE user_id = ?').run(req.params.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    })();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Admin Staff CRUD
app.get('/api/admin/staff', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const staff = db.prepare('SELECT users.id, users.username, users.name, staff.position, staff.department, staff.salary FROM users JOIN staff ON users.id = staff.user_id').all();
  res.json(staff);
});

app.delete('/api/admin/staff/:id', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM staff_academic_years WHERE staff_id = ?').run(req.params.id);
      db.prepare('DELETE FROM staff_subjects WHERE staff_id = ?').run(req.params.id);
      db.prepare('DELETE FROM staff_schedule WHERE staff_id = ?').run(req.params.id);
      db.prepare('DELETE FROM staff WHERE user_id = ?').run(req.params.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    })();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

app.post('/api/admin/reset', authenticateToken, (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  
  const { password } = req.body;
  const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as any;
  
  if (!bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }

  try {
    db.transaction(() => {
      // Delete all records except admin user
      db.prepare('DELETE FROM attendance').run();
      db.prepare('DELETE FROM internal_exams').run();
      db.prepare('DELETE FROM semesters').run();
      db.prepare('DELETE FROM staff_academic_years').run();
      db.prepare('DELETE FROM staff_subjects').run();
      db.prepare('DELETE FROM staff_schedule').run();
      db.prepare('DELETE FROM payments').run();
      db.prepare('DELETE FROM fees').run();
      db.prepare('DELETE FROM students').run();
      db.prepare('DELETE FROM staff').run();
      db.prepare('DELETE FROM users WHERE role != ?').run('admin');
      
      // Log the reset
      db.prepare('INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)').run(req.user.id, 'SYSTEM_RESET', 'Admin erased all data');
    })();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to erase data' });
  }
});

// Chatbot Route
app.post('/api/chat', authenticateToken, async (req: any, res: any) => {
  try {
    const { message } = req.body;
    
    // Fetch some context data to inject into the prompt
    const topStudents = db.prepare('SELECT name, cgpa, total_attendance_percent FROM students JOIN users ON students.user_id = users.id ORDER BY cgpa DESC LIMIT 5').all();
    const staffData = req.user.role === 'staff' ? db.prepare('SELECT name, salary, experience_years FROM staff JOIN users ON staff.user_id = users.id').all() : [];
    
    const context = `
      You are an AI assistant for a College ERP system.
      Current user role: ${req.user.role}.
      ${req.user.role === 'student' ? 'You can answer questions about general college info and global rankings (names only), but NOT other students detailed marks or staff salaries.' : 'You can answer questions about class analytics and general info, but NOT other staff salaries.'}
      
      Database Context (Use this to answer questions):
      Top Students: ${JSON.stringify(topStudents)}
      ${req.user.role === 'staff' ? `Staff Data: ${JSON.stringify(staffData)}` : ''}
    `;

    res.json({ context });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chat context.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
