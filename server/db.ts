import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      user_id INTEGER PRIMARY KEY,
      roll_number TEXT UNIQUE,
      dob TEXT,
      address TEXT,
      parent_details TEXT,
      admission_year INTEGER,
      department TEXT,
      contact_info TEXT,
      cgpa REAL,
      rank INTEGER,
      total_attendance_percent REAL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      user_id INTEGER PRIMARY KEY,
      position TEXT,
      department TEXT,
      salary INTEGER,
      experience_years INTEGER,
      achievements TEXT,
      qualification TEXT,
      joining_date TEXT,
      contact_info TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      date TEXT,
      periods_conducted INTEGER,
      periods_attended INTEGER,
      subject_breakdown TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS internal_exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      subject TEXT,
      internal_1 INTEGER,
      internal_2 INTEGER,
      assignment_marks INTEGER,
      external INTEGER,
      semester INTEGER,
      FOREIGN KEY(student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS upcoming_exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS semesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      semester_number INTEGER,
      attendance_percent REAL,
      rank INTEGER,
      sgpa REAL,
      backlogs INTEGER,
      FOREIGN KEY(student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS staff_academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER,
      academic_year TEXT,
      subjects_taught TEXT,
      pass_percentage REAL,
      avg_internal_marks REAL,
      avg_attendance REAL,
      students_handled INTEGER,
      achievements TEXT,
      FOREIGN KEY(staff_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS staff_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER,
      subject TEXT,
      semester INTEGER,
      total_students INTEGER,
      avg_attendance REAL,
      avg_internal_marks REAL,
      FOREIGN KEY(staff_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS staff_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER,
      period_number INTEGER,
      subject TEXT,
      class_name TEXT,
      time TEXT,
      room TEXT,
      day_of_week TEXT,
      FOREIGN KEY(staff_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      head_id INTEGER,
      established_year INTEGER
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department_id INTEGER,
      credits INTEGER,
      FOREIGN KEY(department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      total_amount INTEGER,
      paid_amount INTEGER,
      due_date TEXT,
      FOREIGN KEY(student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fee_id INTEGER,
      amount INTEGER,
      date TEXT,
      method TEXT,
      FOREIGN KEY(fee_id) REFERENCES fees(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      date TEXT,
      is_read BOOLEAN DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      details TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query_text TEXT,
      intent TEXT,
      confidence REAL,
      success BOOLEAN,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed data if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedData();
  }
}

function seedData() {
  const passwordHash = bcrypt.hashSync('1234', 10);
  const insertUser = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)');
  const insertStudent = db.prepare('INSERT INTO students (user_id, roll_number, dob, address, parent_details, admission_year, department, contact_info, cgpa, rank, total_attendance_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertStaff = db.prepare('INSERT INTO staff (user_id, position, department, salary, experience_years, achievements, qualification, joining_date, contact_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  // Insert Admin
  insertUser.run('admin', passwordHash, 'admin', 'System Administrator');
  
  // Insert Departments
  const insertDept = db.prepare('INSERT INTO departments (name, established_year) VALUES (?, ?)');
  insertDept.run('Computer Science', 2000);
  insertDept.run('Electronics', 2002);
  insertDept.run('Mechanical', 1998);

  // Insert 10 students
  for (let i = 1; i <= 10; i++) {
    const info = insertUser.run(`student${i}`, passwordHash, 'student', `Student Name ${i}`);
    insertStudent.run(
      info.lastInsertRowid,
      `ROLL20230${i}`,
      '2002-05-15',
      `123 Student St, City ${i}`,
      `Parent Name ${i}, 555-010${i}`,
      2023,
      'Computer Science',
      `student${i}@college.edu`,
      (7.0 + (i * 0.2)).toFixed(2),
      11 - i,
      70 + (i * 2)
    );

    // Seed attendance for last 30 days
    const insertAttendance = db.prepare('INSERT INTO attendance (student_id, date, periods_conducted, periods_attended, subject_breakdown) VALUES (?, ?, ?, ?, ?)');
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const attended = Math.floor(Math.random() * 6); // 0 to 5
      insertAttendance.run(info.lastInsertRowid, dateStr, 5, attended, JSON.stringify({
        "Math": attended > 0 ? 1 : 0,
        "Physics": attended > 1 ? 1 : 0,
        "CS": attended > 2 ? 1 : 0,
        "English": attended > 3 ? 1 : 0,
        "Lab": attended > 4 ? 1 : 0
      }));
    }

    // Seed internal exams
    const insertInternal = db.prepare('INSERT INTO internal_exams (student_id, subject, internal_1, internal_2, assignment_marks, external, semester) VALUES (?, ?, ?, ?, ?, ?, ?)');
    ['Math', 'Physics', 'CS', 'English', 'Lab'].forEach(sub => {
      insertInternal.run(info.lastInsertRowid, sub, 12 + Math.floor(Math.random()*8), 12 + Math.floor(Math.random()*8), 5 + Math.floor(Math.random()*5), 40 + Math.floor(Math.random()*20), 1);
    });

    // Seed semesters
    const insertSemester = db.prepare('INSERT INTO semesters (student_id, semester_number, attendance_percent, rank, sgpa, backlogs) VALUES (?, ?, ?, ?, ?, ?)');
    for (let s = 1; s <= 6; s++) {
      insertSemester.run(info.lastInsertRowid, s, 75 + Math.random()*20, Math.floor(Math.random()*50)+1, 7.0 + Math.random()*2.5, Math.random() > 0.8 ? 1 : 0);
    }

    // Seed fees
    const insertFee = db.prepare('INSERT INTO fees (student_id, total_amount, paid_amount, due_date) VALUES (?, ?, ?, ?)');
    const totalFee = 150000;
    const paidFee = Math.random() > 0.3 ? totalFee : totalFee - 50000;
    insertFee.run(info.lastInsertRowid, totalFee, paidFee, '2024-06-01');
  }

  // Insert 5 staff
  for (let i = 1; i <= 5; i++) {
    const info = insertUser.run(`staff${i}`, passwordHash, 'staff', `Prof. Staff Name ${i}`);
    insertStaff.run(
      info.lastInsertRowid,
      i === 1 ? 'HOD' : 'Assistant Professor',
      'Computer Science',
      60000 + (i * 5000),
      5 + i,
      `Published ${i} papers in international journals`,
      'Ph.D. in Computer Science',
      `201${5+i}-08-01`,
      `staff${i}@college.edu`
    );

    // Seed staff academic years
    const insertStaffYear = db.prepare('INSERT INTO staff_academic_years (staff_id, academic_year, subjects_taught, pass_percentage, avg_internal_marks, avg_attendance, students_handled, achievements) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertStaffYear.run(info.lastInsertRowid, '2022-23', 'Data Structures, Algorithms', 85.5, 32.4, 88.2, 120, 'Best Teacher Award');
    insertStaffYear.run(info.lastInsertRowid, '2023-24', 'Operating Systems, Networks', 90.2, 34.1, 91.5, 130, 'Published Book');

    // Seed staff subjects
    const insertStaffSub = db.prepare('INSERT INTO staff_subjects (staff_id, subject, semester, total_students, avg_attendance, avg_internal_marks) VALUES (?, ?, ?, ?, ?, ?)');
    insertStaffSub.run(info.lastInsertRowid, `Subject A${i}`, 3, 60, 85.5, 33.2);
    insertStaffSub.run(info.lastInsertRowid, `Subject B${i}`, 4, 55, 88.1, 35.0);

    // Seed staff schedule
    const insertSchedule = db.prepare('INSERT INTO staff_schedule (staff_id, period_number, subject, class_name, time, room, day_of_week) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    days.forEach(day => {
      insertSchedule.run(info.lastInsertRowid, 1, `Subject A${i}`, 'CS-A', '09:00 AM - 10:00 AM', `Room ${100+i}`, day);
      insertSchedule.run(info.lastInsertRowid, 3, `Subject B${i}`, 'CS-B', '11:15 AM - 12:15 PM', `Room ${200+i}`, day);
    });
  }

  // Seed upcoming exams
  const insertUpcoming = db.prepare('INSERT INTO upcoming_exams (subject, date) VALUES (?, ?)');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  insertUpcoming.run('Data Structures', futureDate.toISOString().split('T')[0]);
  futureDate.setDate(futureDate.getDate() + 5);
  insertUpcoming.run('Operating Systems', futureDate.toISOString().split('T')[0]);
}

export default db;
