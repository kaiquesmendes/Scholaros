// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaMapMarkerAlt, FaGraduationCap, 
  FaUniversity, FaCalendar, FaGithub, FaLinkedin, 
  FaInstagram, FaEdit, FaSave, FaTimes, FaTrophy,
  FaFire, FaBrain, FaChartLine, FaAward, FaClock,
  FaCheckCircle, FaSpinner, FaCamera, FaUpload
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  auth, getFullUserData, updateUserProfile, updateStudyStats, 
  db, doc, updateDoc, storage, ref, uploadBytes, getDownloadURL 
} from '../config/firebase';
import toast from 'react-hot-toast';

const Profile = ({ user: propUser }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    course: '',
    university: '',
    semester: '',
    location: '',
    github: '',
    linkedin: '',
    instagram: ''
  });

  // Buscar dados reais do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!propUser?.uid) return;
      
      setLoading(true);
      try {
        const result = await getFullUserData(propUser.uid);
        if (result.success) {
          setUserData(result.data);
          setEditForm({
            name: result.data.name || '',
            bio: result.data.bio || '',
            course: result.data.course || '',
            university: result.data.university || '',
            semester: result.data.semester || '',
            location: result.data.location || '',
            github: result.data.socialLinks?.github || '',
            linkedin: result.data.socialLinks?.linkedin || '',
            instagram: result.data.socialLinks?.instagram || ''
          });
        } else {
          toast.error('Erro ao carregar dados');
        }
      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [propUser]);

  // Upload de foto de perfil
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem (JPG, PNG, GIF)');
      return;
    }
    
    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    
    setUploadingPhoto(true);
    
    try {
      // Criar referência no Storage
      const storageRef = ref(storage, `profile_photos/${propUser.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      // Atualizar no Firestore e Authentication
      await updateDoc(doc(db, 'users', propUser.uid), { photoURL });
      await updateUserProfile(propUser.uid, { photoURL });
      
      // Atualizar estado local
      setUserData(prev => ({ ...prev, photoURL }));
      
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateUserProfile(propUser.uid, editForm);
      if (result.success) {
        setUserData(prev => ({
          ...prev,
          name: editForm.name,
          bio: editForm.bio,
          course: editForm.course,
          university: editForm.university,
          semester: editForm.semester,
          location: editForm.location,
          socialLinks: {
            github: editForm.github,
            linkedin: editForm.linkedin,
            instagram: editForm.instagram
          }
        }));
        setIsEditing(false);
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setEditForm({
        name: userData.name || '',
        bio: userData.bio || '',
        course: userData.course || '',
        university: userData.university || '',
        semester: userData.semester || '',
        location: userData.location || '',
        github: userData.socialLinks?.github || '',
        linkedin: userData.socialLinks?.linkedin || '',
        instagram: userData.socialLinks?.instagram || ''
      });
    }
    setIsEditing(false);
  };

  const calculateXPProgress = () => {
    const stats = userData?.stats || {};
    const currentXP = stats.currentXP || 0;
    const nextLevelXP = stats.nextLevelXP || 1000;
    return (currentXP / nextLevelXP) * 100;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar user={propUser} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = userData?.stats || {};
  const badges = userData?.badges || [];
  const activities = userData?.recentActivities || [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={propUser} />
      <div className="flex-1 overflow-auto">
        <Header user={propUser} />
        
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header do Perfil com Foto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-6"
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  {/* Foto de Perfil com upload */}
                  <div className="relative group">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl overflow-hidden">
                      {userData?.photoURL ? (
                        <img src={userData.photoURL} alt={userData.name} className="w-full h-full object-cover" />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-purple-800 rounded-full cursor-pointer hover:bg-purple-700 transition-all opacity-0 group-hover:opacity-100">
                      <FaCamera size={14} />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <FaSpinner className="animate-spin text-white text-2xl" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="text-2xl font-bold bg-white/20 rounded-lg px-3 py-1 text-white placeholder-white/50 w-full"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold">{userData?.name || 'Estudante'}</h1>
                    )}
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="text-sm bg-white/20 rounded-lg px-3 py-1 text-white placeholder-white/50 w-full mt-1"
                        placeholder="Sua bio"
                      />
                    ) : (
                      <p className="text-white/80 mt-1">{userData?.bio || 'Estudante dedicado'}</p>
                    )}
                    <div className="flex gap-4 mt-3 text-sm flex-wrap">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editForm.course}
                            onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                            className="bg-white/20 rounded-lg px-2 py-1 text-white placeholder-white/50 text-sm"
                            placeholder="Curso"
                          />
                          <input
                            type="text"
                            value={editForm.university}
                            onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                            className="bg-white/20 rounded-lg px-2 py-1 text-white placeholder-white/50 text-sm"
                            placeholder="Universidade"
                          />
                          <input
                            type="text"
                            value={editForm.semester}
                            onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                            className="bg-white/20 rounded-lg px-2 py-1 text-white placeholder-white/50 text-sm"
                            placeholder="Semestre"
                          />
                        </>
                      ) : (
                        <>
                          {userData?.course && <span className="flex items-center gap-1"><FaGraduationCap /> {userData.course}</span>}
                          {userData?.university && <span className="flex items-center gap-1"><FaUniversity /> {userData.university}</span>}
                          {userData?.semester && <span className="flex items-center gap-1"><FaCalendar /> {userData.semester}</span>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                      >
                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />} Salvar
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

            {/* Stats Cards melhorados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard 
                icon={<FaFire className="text-orange-500" />} 
                label="Sequência" 
                value={`${stats.currentStreak || 0} dias`}
                subtitle={`Maior: ${stats.longestStreak || 0} dias`}
              />
              <StatCard 
                icon={<FaBrain className="text-purple-500" />} 
                label="Nível" 
                value={stats.level || 1}
                subtitle={`${stats.currentXP || 0} / ${stats.nextLevelXP || 1000} XP`}
              />
              <StatCard 
                icon={<FaChartLine className="text-green-500" />} 
                label="Média Redações" 
                value={stats.averageEssayScore || 0}
                subtitle={`${stats.totalEssaysWritten || 0} redações`}
              />
              <StatCard 
                icon={<FaClock className="text-blue-500" />} 
                label="Horas Estudadas" 
                value={`${stats.totalStudyHours || 0}h`}
                subtitle={`${stats.studySessions || 0} sessões`}
              />
            </div>

            {/* XP Progress Bar com animação */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
              <div className="flex justify-between mb-2 flex-wrap gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Nível {stats.level || 1} • {stats.currentXP || 0} / {stats.nextLevelXP || 1000} XP
                </span>
                <span className="text-sm text-purple-600">
                  📈 Próximo nível: {(stats.nextLevelXP || 1000) - (stats.currentXP || 0)} XP restantes
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateXPProgress()}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>🔰 Iniciante</span>
                <span>⚡ Intermediário</span>
                <span>🏆 Avançado</span>
                <span>🎓 Mestre</span>
              </div>
            </div>

            {/* Tabs com ícones melhores */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <TabButton 
                active={activeTab === 'stats'} 
                onClick={() => setActiveTab('stats')} 
                icon={<FaChartLine />} 
                label="Estatísticas" 
              />
              <TabButton 
                active={activeTab === 'badges'} 
                onClick={() => setActiveTab('badges')} 
                icon={<FaTrophy />} 
                label="Conquistas" 
                count={`${stats.badgesEarned || 0}/${stats.totalBadges || 35}`}
              />
              <TabButton 
                active={activeTab === 'activities'} 
                onClick={() => setActiveTab('activities')} 
                icon={<FaClock />} 
                label="Atividades"
                count={activities?.length || 0}
              />
            </div>

            {/* Tab Content */}
            {activeTab === 'stats' && <StatsTab stats={stats} userData={userData} userEmail={propUser?.email} />}
            {activeTab === 'badges' && <BadgesTab badges={badges} />}
            {activeTab === 'activities' && <ActivitiesTab activities={activities} />}
            
            {/* Dicas e próximos passos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">💡</span>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300">Dica do ScholarOS</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                    Complete atividades para ganhar XP e desbloquear novas conquistas! 
                    Cada hora de estudo = 10 XP, cada redação = 50 XP, cada PDF = 20 XP.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Componentes auxiliares melhorados
const StatCard = ({ icon, label, value, subtitle }) => (
  <motion.div 
    whileHover={{ scale: 1.02, y: -2 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center transition-all"
  >
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </motion.div>
);

const TabButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-t-lg transition-all flex items-center gap-2 ${
      active 
        ? 'bg-purple-600 text-white shadow-lg' 
        : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
    }`}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
        {count}
      </span>
    )}
  </button>
);

const StatsTab = ({ stats, userData, userEmail }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📊 Estatísticas de Estudo</h3>
      <div className="space-y-3">
        <StatRow label="Total de horas estudadas" value={`${stats.totalStudyHours || 0} horas`} />
        <StatRow label="Sessões de estudo" value={stats.studySessions || 0} />
        <StatRow label="Redações escritas" value={stats.totalEssaysWritten || 0} />
        <StatRow label="PDFs processados" value={stats.totalPDFsProcessed || 0} />
        <StatRow label="Desafios completados" value={stats.completedChallenges || 0} />
        <StatRow label="Maior sequência" value={`${stats.longestStreak || 0} dias`} />
        <StatRow label="XP total ganho" value={`${stats.currentXP || 0} XP`} />
      </div>
    </div>
    
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white mb-4">👤 Informações Pessoais</h3>
      <div className="space-y-3">
        <StatRow label="Email" value={userEmail || userData?.email || 'Não informado'} icon={<FaEnvelope />} />
        <StatRow label="Localização" value={userData?.location || 'Não informado'} icon={<FaMapMarkerAlt />} />
        <StatRow label="Curso" value={userData?.course || 'Não informado'} icon={<FaGraduationCap />} />
        <StatRow label="Universidade" value={userData?.university || 'Não informado'} icon={<FaUniversity />} />
        <StatRow label="Membro desde" value={userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('pt-BR') : 'Não informado'} icon={<FaCalendar />} />
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Redes Sociais</h4>
        <div className="flex gap-4">
          {userData?.socialLinks?.github && (
            <a href={`https://github.com/${userData.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600 transition-colors">
              <FaGithub size={24} />
            </a>
          )}
          {userData?.socialLinks?.linkedin && (
            <a href={`https://linkedin.com/in/${userData.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600 transition-colors">
              <FaLinkedin size={24} />
            </a>
          )}
          {userData?.socialLinks?.instagram && (
            <a href={`https://instagram.com/${userData.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600 transition-colors">
              <FaInstagram size={24} />
            </a>
          )}
          {!userData?.socialLinks?.github && !userData?.socialLinks?.linkedin && !userData?.socialLinks?.instagram && (
            <p className="text-sm text-gray-500">Nenhuma rede social adicionada</p>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

const BadgesTab = ({ badges }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
    <h3 className="font-semibold text-gray-800 dark:text-white mb-6">🏆 Minhas Conquistas</h3>
    {badges?.filter(b => b.earned).length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <div className="text-6xl mb-4">🏆</div>
        <p>Nenhuma conquista desbloqueada ainda</p>
        <p className="text-sm mt-1">Complete atividades para ganhar badges!</p>
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges?.map((badge) => (
          <div key={badge.id} className={`p-4 rounded-xl text-center transition-all ${
            badge.earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400' : 'bg-gray-50 dark:bg-gray-700/50 opacity-50 grayscale'
          }`}>
            <div className="text-4xl mb-2">{badge.icon}</div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">{badge.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{badge.description}</p>
            {badge.earned && badge.date && (
              <p className="text-xs text-green-600 mt-2">
                <FaCheckCircle className="inline mr-1" size={10} /> 
                {new Date(badge.date).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

const ActivitiesTab = ({ activities }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
    <h3 className="font-semibold text-gray-800 dark:text-white mb-6">📝 Histórico de Atividades</h3>
    <div className="space-y-4 max-h-[500px] overflow-y-auto">
      {activities?.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl">
              {activity.icon || (activity.type === 'essay' ? '✍️' : activity.type === 'pdf' ? '📄' : activity.type === 'study' ? '📚' : '🎉')}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800 dark:text-white">{activity.title}</p>
              {activity.description && <p className="text-sm text-gray-500">{activity.description}</p>}
              {activity.score && <p className="text-sm text-purple-600">🏆 Nota: {activity.score}</p>}
              {activity.duration && <p className="text-sm text-green-600">⏱️ {activity.duration}</p>}
              {activity.xpGained && <p className="text-sm text-yellow-600">✨ +{activity.xpGained} XP</p>}
              <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-6xl mb-4">📭</div>
          <p>Nenhuma atividade registrada ainda</p>
          <p className="text-sm mt-1">Comece a estudar para ver seu progresso!</p>
        </div>
      )}
    </div>
  </motion.div>
);

const StatRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">{icon} {label}</span>
    <span className="font-semibold text-gray-800 dark:text-white">{value}</span>
  </div>
);

export default Profile;