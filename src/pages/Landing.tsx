import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, ShieldAlert } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 z-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Smart Campus
        </h1>
        <p className="text-xl text-gray-300">The Future of Campus Management</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login/admin')}
          className="glass-panel w-64 h-64 flex flex-col items-center justify-center gap-6 group hover:border-red-400/50 transition-colors"
        >
          <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
            <ShieldAlert size={48} className="text-red-300" />
          </div>
          <span className="text-2xl font-semibold tracking-wide">Admin</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login/student')}
          className="glass-panel w-64 h-64 flex flex-col items-center justify-center gap-6 group hover:border-blue-400/50 transition-colors"
        >
          <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
            <GraduationCap size={48} className="text-blue-300" />
          </div>
          <span className="text-2xl font-semibold tracking-wide">Student</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login/staff')}
          className="glass-panel w-64 h-64 flex flex-col items-center justify-center gap-6 group hover:border-purple-400/50 transition-colors"
        >
          <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
            <Users size={48} className="text-purple-300" />
          </div>
          <span className="text-2xl font-semibold tracking-wide">Staff</span>
        </motion.button>
      </div>
    </div>
  );
}
