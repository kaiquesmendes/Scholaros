// frontend/src/pages/Profile.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaMapMarkerAlt, FaGraduationCap, 
  FaUniversity, FaCalendar, FaGithub, FaLinkedin, 
  FaInstagram, FaEdit, FaSave, FaTimes, FaTrophy,
  FaFire, FaBrain, FaChartLine, FaAward, FaClock,
  FaCheckCircle, FaSpinner
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, userStats, badges, activities, updateUser } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(user);
  const [activeTab, setActiveTab] = useState('stats'); // stats, badges, activities

  const handleSave = () => {
    updateUser(editForm);
    setIsEditing(false);
    toast.success('Perfil atualizado com sucesso!');
  };

  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  const calculateXPProgress = () => {
    return (userStats.currentXP / userStats.nextLevelXP) * 100;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header do Perfil */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="rounded-full" />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="text-2xl font-bold bg-white/20 rounded-lg px-3 py-1 text-white placeholder-white/50"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold">{user.name}</h1>
                    )}
                    <p className="text-white/80 mt-1">{user.bio}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1">
                        <FaGraduationCap /> {user.course}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaUniversity /> {user.university}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCalendar /> {user.semester}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                      >
                        <FaSave /> Salvar
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                      >
                        <FaTimes /> Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                      <FaEdit /> Editar Perfil
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard icon={<FaFire className="text-orange-500" />} label="Sequência" value={`${userStats.currentStreak} dias`} />
              <StatCard icon={<FaBrain className="text-purple-500" />} label="Nível" value={userStats.level} />
              <StatCard icon={<FaChartLine className="text-green-500" />} label="Média Redações" value={userStats.averageEssayScore} />
              <StatCard icon={<FaClock className="text-blue-500" />} label="Horas Estudadas" value={`${userStats.totalStudyHours}h`} />
            </div>

            {/* XP Progress Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Nível {userStats.level} • {userStats.currentXP} / {userStats.nextLevelXP} XP
                </span>
                <span className="text-sm text-purple-600">Próximo nível em {userStats.nextLevelXP - userStats.currentXP} XP</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${calculateXPProgress()}%` }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<FaChartLine />} label="Estatísticas" />
              <TabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} icon={<FaTrophy />} label="Conquistas" count={`${userStats.badgesEarned}/${userStats.totalBadges}`} />
              <TabButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} icon={<FaClock />} label="Atividades" />
            </div>

            {/* Tab Content */}
            {activeTab === 'stats' && <StatsTab userStats={userStats} user={user} />}
            {activeTab === 'badges' && <BadgesTab badges={badges} />}
            {activeTab === 'activities' && <ActivitiesTab activities={activities} />}
          </div>
        </main>
      </div>
    </div>
  );
};

// Componente StatCard
const StatCard = ({ icon, label, value }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center"
  >
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
  </motion.div>
);

// Componente TabButton
const TabButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-t-lg transition-all flex items-center gap-2 ${
      active 
        ? 'bg-purple-600 text-white' 
        : 'text-gray-600 dark:text-gray-400 hover:text-purple-600'
    }`}
  >
    {icon}
    <span>{label}</span>
    {count && <span className="text-sm opacity-75">({count})</span>}
  </button>
);

// Componente StatsTab
const StatsTab = ({ userStats, user }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="grid grid-cols-1 md:grid-cols-2 gap-6"
  >
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📊 Estatísticas de Estudo</h3>
      <div className="space-y-3">
        <StatRow label="Total de horas estudadas" value={`${userStats.totalStudyHours} horas`} />
        <StatRow label="Sessões de estudo" value={userStats.studySessions} />
        <StatRow label="Redações escritas" value={userStats.totalEssaysWritten} />
        <StatRow label="PDFs processados" value={userStats.totalPDFsProcessed} />
        <StatRow label="Desafios completados" value={userStats.completedChallenges} />
        <StatRow label="Maior sequência" value={`${userStats.longestStreak} dias`} />
      </div>
    </div>
    
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white mb-4">👤 Informações Pessoais</h3>
      <div className="space-y-3">
        <StatRow label="Email" value={user.email} icon={<FaEnvelope />} />
        <StatRow label="Localização" value={user.location} icon={<FaMapMarkerAlt />} />
        <StatRow label="Curso" value={user.course} icon={<FaGraduationCap />} />
        <StatRow label="Universidade" value={user.university} icon={<FaUniversity />} />
        <StatRow label="Membro desde" value={new Date(user.joinDate).toLocaleDateString('pt-BR')} icon={<FaCalendar />} />
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Redes Sociais</h4>
        <div className="flex gap-4">
          <a href={`https://github.com/${user.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600 transition-colors">
            <FaGithub size={24} />
          </a>
          <a href={`https://linkedin.com/in/${user.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600 transition-colors">
            <FaLinkedin size={24} />
          </a>
          <a href={`https://instagram.com/${user.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600 transition-colors">
            <FaInstagram size={24} />
          </a>
        </div>
      </div>
    </div>
  </motion.div>
);

// Componente BadgesTab
const BadgesTab = ({ badges }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
  >
    <h3 className="font-semibold text-gray-800 dark:text-white mb-6">🏆 Minhas Conquistas</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`p-4 rounded-xl text-center transition-all ${
            badge.earned
              ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400'
              : 'bg-gray-50 dark:bg-gray-700/50 opacity-50'
          }`}
        >
          <div className="text-4xl mb-2">{badge.icon}</div>
          <p className="font-semibold text-gray-800 dark:text-white text-sm">{badge.name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{badge.description}</p>
          {badge.earned && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              <FaCheckCircle className="inline mr-1" size={10} />
              {new Date(badge.date).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      ))}
    </div>
  </motion.div>
);

// Componente ActivitiesTab
const ActivitiesTab = ({ activities }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
  >
    <h3 className="font-semibold text-gray-800 dark:text-white mb-6">📝 Histórico de Atividades</h3>
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            {activity.type === 'essay' && '✍️'}
            {activity.type === 'pdf' && '📄'}
            {activity.type === 'study' && '📚'}
            {activity.type === 'badge' && '🏆'}
            {activity.type === 'challenge' && '🎯'}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800 dark:text-white">{activity.title}</p>
            {activity.score && <p className="text-sm text-purple-600">Nota: {activity.score}</p>}
            {activity.duration && <p className="text-sm text-gray-500">Duração: {activity.duration}</p>}
            {activity.reward && <p className="text-sm text-green-600">{activity.reward}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(activity.date).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

// Componente StatRow
const StatRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
      {icon} {label}
    </span>
    <span className="font-semibold text-gray-800 dark:text-white">{value}</span>
  </div>
);

export default Profile;