// frontend/src/services/badgeService.js
import toast from 'react-hot-toast';
import { getFullUserData, updateUserData } from '../config/firebase';

// Cada conquista é avaliada contra as estatísticas reais salvas no Firestore.
// `progress(stats)` devolve o valor atual e `goal` é o valor necessário.
const BADGES = {
  first_study: {
    id: 1, name: 'Primeiros Passos', description: 'Complete seu primeiro estudo', icon: '🌟',
    goal: 1, progress: (s) => s.studySessions || 0,
  },
  dedicated: {
    id: 2, name: 'Dedicado', description: '30 dias de estudo consecutivo', icon: '🔥',
    goal: 30, progress: (s) => Math.max(s.currentStreak || 0, s.longestStreak || 0),
  },
  master_essay: {
    id: 3, name: 'Mestre das Redações', description: '10 redações analisadas', icon: '✍️',
    goal: 10, progress: (s) => s.totalEssaysWritten || 0,
  },
  voracious_reader: {
    id: 4, name: 'Leitor Voraz', description: '50 PDFs processados', icon: '📚',
    goal: 50, progress: (s) => s.totalPDFsProcessed || 0,
  },
  perfect_score: {
    id: 5, name: 'Nota 1000', description: 'Redação ENEM nota 1000', icon: '🏆',
    goal: 1000, progress: (s) => s.bestEnemScore || 0,
  },
  study_master: {
    id: 6, name: 'Mestre dos Estudos', description: '100 horas de estudo', icon: '🎓',
    goal: 100, progress: (s) => s.totalStudyHours || 0,
  },
};

// Reavalia todas as conquistas com os dados atuais do usuário. Os parâmetros
// `actionType`/`currentValue` são mantidos só por compatibilidade com quem já chama.
export const checkBadges = async (uid) => {
  try {
    const userData = await getFullUserData(uid);
    if (!userData.success) return { success: false };

    const stats = userData.data.stats || {};
    const currentBadges = userData.data.badges || [];
    const newBadges = [...currentBadges];
    const unlocked = [];

    for (const badge of Object.values(BADGES)) {
      const alreadyEarned = currentBadges.some((b) => b.id === badge.id && b.earned);
      if (alreadyEarned || badge.progress(stats) < badge.goal) continue;

      const earned = {
        id: badge.id, name: badge.name, description: badge.description, icon: badge.icon,
        earned: true, date: new Date().toISOString(),
      };
      const index = newBadges.findIndex((b) => b.id === badge.id);
      if (index >= 0) newBadges[index] = earned;
      else newBadges.push(earned);
      unlocked.push(badge);
    }

    if (unlocked.length > 0) {
      await updateUserData(uid, {
        badges: newBadges,
        'stats.badgesEarned': newBadges.filter((b) => b.earned).length,
      });
      unlocked.forEach((b) => toast.success(`${b.icon} Conquista desbloqueada: ${b.name}!`));
    }

    return { success: true, hasNewBadge: unlocked.length > 0 };
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    return { success: false };
  }
};

export const BADGES_LIST = BADGES;
