// frontend/src/store/useStore.js
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Dados do usuário
  user: {
    id: 'user_123',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    avatar: null,
    bio: 'Estudante de Engenharia apaixonado por tecnologia e matemática 📚',
    location: 'São Paulo, SP',
    course: 'Engenharia de Software',
    university: 'Universidade Federal',
    semester: '6º semestre',
    joinDate: '2024-01-15',
    socialLinks: {
      github: 'joaosilva',
      linkedin: 'joaosilva',
      instagram: '@joao.study'
    }
  },
  
  // Estatísticas do usuário
  userStats: {
    totalStudyHours: 347,
    totalEssaysWritten: 28,
    averageEssayScore: 785,
    totalPDFsProcessed: 15,
    currentStreak: 14,
    longestStreak: 32,
    badgesEarned: 12,
    totalBadges: 35,
    level: 7,
    currentXP: 2340,
    nextLevelXP: 3000,
    completedChallenges: 23,
    studySessions: 89
  },
  
  // Conquistas/Badges
  badges: [
    { id: 1, name: 'Primeiros Passos', description: 'Completou o primeiro estudo', icon: '🌟', earned: true, date: '2024-01-20' },
    { id: 2, name: 'Dedicado', description: '30 dias de estudo consecutivo', icon: '🔥', earned: true, date: '2024-02-15' },
    { id: 3, name: 'Mestre das Redações', description: '10 redações analisadas', icon: '✍️', earned: true, date: '2024-03-10' },
    { id: 4, name: 'Matemático', description: '100% em matemática', icon: '📐', earned: false },
    { id: 5, name: 'Leitor Voraz', description: '50 PDFs processados', icon: '📚', earned: false },
    { id: 6, name: 'Ajudante', description: 'Ajudou 10 colegas', icon: '🤝', earned: true, date: '2024-04-01' },
    { id: 7, name: 'Nota 1000', description: 'Redação nota 1000', icon: '🏆', earned: false },
    { id: 8, name: 'Madrugador', description: 'Estudou antes das 6h 10 vezes', icon: '🌅', earned: true, date: '2024-03-25' }
  ],
  
  // Histórico de atividades
  activities: [
    { id: 1, type: 'essay', title: 'Redação ENEM analisada', score: 820, date: '2024-05-07T10:30:00' },
    { id: 2, type: 'pdf', title: 'PDF "Matemática Básica" processado', pages: 45, date: '2024-05-06T15:20:00' },
    { id: 3, type: 'study', title: 'Sessão de estudo concluída', duration: '2h', date: '2024-05-06T09:00:00' },
    { id: 4, type: 'badge', title: 'Conquista "Dedicado" desbloqueada', date: '2024-05-05T20:00:00' },
    { id: 5, type: 'essay', title: 'Redação modelo ENEM analisada', score: 790, date: '2024-05-04T14:15:00' },
    { id: 6, type: 'challenge', title: 'Desafio semanal concluído', reward: '150 XP', date: '2024-05-03T18:30:00' }
  ],
  
  // Configurações
  settings: {
    theme: 'dark',
    notifications: true,
    emailUpdates: false,
    studyReminders: true,
    privacyLevel: 'public'
  },
  
  // Ações
  updateUser: (userData) => set((state) => ({ 
    user: { ...state.user, ...userData } 
  })),
  
  updateSettings: (settingsData) => set((state) => ({ 
    settings: { ...state.settings, ...settingsData } 
  })),
  
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities].slice(0, 20)
  })),
  
  earnBadge: (badgeId) => set((state) => ({
    badges: state.badges.map(badge => 
      badge.id === badgeId 
        ? { ...badge, earned: true, date: new Date().toISOString().split('T')[0] }
        : badge
    )
  })),
  
  addXP: (amount) => set((state) => {
    const newXP = state.userStats.currentXP + amount;
    let newLevel = state.userStats.level;
    let remainingXP = newXP;
    
    if (newXP >= state.userStats.nextLevelXP) {
      newLevel++;
      remainingXP = newXP - state.userStats.nextLevelXP;
    }
    
    return {
      userStats: {
        ...state.userStats,
        currentXP: remainingXP,
        level: newLevel,
        nextLevelXP: newLevel * 1000
      }
    };
  })
}));

export default useStore;