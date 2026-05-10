// frontend/src/services/badgeService.js
import { getFullUserData, updateUserData } from '../config/firebase';

const BADGES = {
  first_study: { id: 1, name: 'Primeiros Passos', description: 'Complete seu primeiro estudo', icon: '🌟', requirement: { type: 'study', value: 1 } },
  dedicated: { id: 2, name: 'Dedicado', description: '30 dias de estudo consecutivo', icon: '🔥', requirement: { type: 'streak', value: 30 } },
  master_essay: { id: 3, name: 'Mestre das Redações', description: '10 redações analisadas', icon: '✍️', requirement: { type: 'essay', value: 10 } },
  voracious_reader: { id: 4, name: 'Leitor Voraz', description: '50 PDFs processados', icon: '📚', requirement: { type: 'pdf', value: 50 } },
  perfect_score: { id: 5, name: 'Nota 1000', description: 'Redação nota 1000', icon: '🏆', requirement: { type: 'essay_grade', value: 1000 } },
  study_master: { id: 6, name: 'Mestre dos Estudos', description: '100 horas de estudo', icon: '🎓', requirement: { type: 'hours', value: 100 } },
};

export const checkBadges = async (uid, actionType, currentValue) => {
  try {
    const userData = await getFullUserData(uid);
    if (!userData.success) return;
    
    const currentBadges = userData.data.badges || [];
    let newBadges = [...currentBadges];
    let hasNewBadge = false;
    
    for (const badge of Object.values(BADGES)) {
      const alreadyEarned = currentBadges.find(b => b.id === badge.id && b.earned);
      if (!alreadyEarned) {
        let shouldEarn = false;
        
        switch (badge.requirement.type) {
          case 'study':
            if (actionType === 'study' && currentValue >= badge.requirement.value) shouldEarn = true;
            break;
          case 'streak':
            if (actionType === 'streak' && currentValue >= badge.requirement.value) shouldEarn = true;
            break;
          case 'essay':
            if (actionType === 'essay' && currentValue >= badge.requirement.value) shouldEarn = true;
            break;
          case 'pdf':
            if (actionType === 'pdf' && currentValue >= badge.requirement.value) shouldEarn = true;
            break;
          case 'hours':
            if (actionType === 'hours' && currentValue >= badge.requirement.value) shouldEarn = true;
            break;
        }
        
        if (shouldEarn) {
          const badgeIndex = newBadges.findIndex(b => b.id === badge.id);
          if (badgeIndex >= 0) {
            newBadges[badgeIndex] = { ...badge, earned: true, date: new Date().toISOString() };
          } else {
            newBadges.push({ ...badge, earned: true, date: new Date().toISOString() });
          }
          hasNewBadge = true;
        }
      }
    }
    
    if (hasNewBadge) {
      await updateUserData(uid, { badges: newBadges, 'stats.badgesEarned': newBadges.filter(b => b.earned).length });
    }
    
    return { success: true, hasNewBadge };
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    return { success: false };
  }
};

export const BADGES_LIST = BADGES;