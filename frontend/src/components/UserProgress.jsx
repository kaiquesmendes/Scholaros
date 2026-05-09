import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaChartLine, FaFire, FaBrain } from 'react-icons/fa';
import useStore from '../store/useStore';

const UserProgress = () => {
  const { user, stats } = useStore();
  const xpProgress = (user.xp / user.nextLevelXp) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white mb-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold">{user.name}</h3>
          <p className="text-white/80">Nível {user.level} • Estrela Acadêmica</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <FaStar className="text-yellow-400" />
            <span className="font-bold">{user.xp}/{user.nextLevelXp} XP</span>
          </div>
          <div className="w-32 h-2 bg-white/20 rounded-full mt-1">
            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${xpProgress}%` }}></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <FaFire className="mx-auto text-2xl mb-1" />
          <p className="text-2xl font-bold">{stats.streak}</p>
          <p className="text-xs text-white/80">Dias seguidos</p>
        </div>
        <div className="text-center">
          <FaChartLine className="mx-auto text-2xl mb-1" />
          <p className="text-2xl font-bold">{stats.totalHours}h</p>
          <p className="text-xs text-white/80">Horas totais</p>
        </div>
        <div className="text-center">
          <FaBrain className="mx-auto text-2xl mb-1" />
          <p className="text-2xl font-bold">{stats.averageRetention}%</p>
          <p className="text-xs text-white/80">Retenção média</p>
        </div>
      </div>
    </motion.div>
  );
};

export default UserProgress;