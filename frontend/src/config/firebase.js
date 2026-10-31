// frontend/src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Suas configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCUx_JRuPAkTQhgB9pOCasrn6MsQ2SPfTs",
  authDomain: "faqfatec.firebaseapp.com",
  projectId: "faqfatec",
  storageBucket: "faqfatec.firebasestorage.app",
  messagingSenderId: "415493199564",
  appId: "1:415493199564:web:cbd6017de8a53ee595d469"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Providers para login social
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Exportar funções do Firestore
export { 
  // Auth
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithPopup,
  // Firestore
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  // Storage
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

// ========== FUNÇÃO DE CRIAÇÃO DE USUÁRIO ==========
const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date().toISOString();
    
    try {
      await setDoc(userRef, {
        // Informações básicas
        name: displayName || additionalData.name || 'Estudante',
        email: email || additionalData.email,
        photoURL: photoURL || null,
        bio: additionalData.bio || 'Estudante dedicado',
        course: additionalData.course || '',
        university: additionalData.university || '',
        semester: additionalData.semester || '',
        location: additionalData.location || '',
        joinDate: createdAt,
        socialLinks: {
          github: additionalData.github || '',
          linkedin: additionalData.linkedin || '',
          instagram: additionalData.instagram || ''
        },
        
        // Estatísticas
        stats: {
          totalStudyHours: 0,
          totalEssaysWritten: 0,
          averageEssayScore: 0,
          currentStreak: 0,
          longestStreak: 0,
          level: 1,
          currentXP: 0,
          nextLevelXP: 1000,
          completedGoals: 0,
          totalGoals: 50,
          averageRetention: 0,
          badgesEarned: 0,
          totalBadges: 35,
          studySessions: 0,
          completedChallenges: 0,
          totalPDFsProcessed: 0
        },
        
        // Matérias com progresso
        subjects: [
          { name: 'Matemática', progress: 0, color: '#8b5cf6', hours: 0, goal: 50 },
          { name: 'Português', progress: 0, color: '#ec4899', hours: 0, goal: 50 },
          { name: 'Redação', progress: 0, color: '#06b6d4', hours: 0, goal: 50 },
          { name: 'Física', progress: 0, color: '#f59e0b', hours: 0, goal: 50 },
          { name: 'Química', progress: 0, color: '#10b981', hours: 0, goal: 50 }
        ],
        
        // Conquistas/Badges
        badges: [
          { id: 1, name: 'Primeiros Passos', description: 'Complete seu primeiro estudo', icon: '🌟', earned: false, date: null },
          { id: 2, name: 'Dedicado', description: '30 dias de estudo consecutivo', icon: '🔥', earned: false, date: null },
          { id: 3, name: 'Mestre das Redações', description: '10 redações analisadas', icon: '✍️', earned: false, date: null },
          { id: 4, name: 'Leitor Voraz', description: '50 PDFs processados', icon: '📚', earned: false, date: null },
          { id: 5, name: 'Nota 1000', description: 'Redação nota 1000', icon: '🏆', earned: false, date: null },
          { id: 6, name: 'Mestre dos Estudos', description: '100 horas de estudo', icon: '🎓', earned: false, date: null },
          { id: 7, name: 'Desafiador', description: '10 desafios completados', icon: '⚡', earned: false, date: null },
          { id: 8, name: 'Social', description: '100 mensagens no chat', icon: '🦋', earned: false, date: null }
        ],
        
        // Atividades recentes
        recentActivities: [
          { 
            id: Date.now(), 
            title: 'Bem-vindo ao ScholarOS!', 
            description: 'Complete seu primeiro estudo para ganhar XP', 
            date: new Date().toLocaleString('pt-BR'), 
            icon: '🎉', 
            type: 'welcome',
            xpGained: 0
          }
        ],
        
        // Histórico de PDFs
        recentPDFs: [],
        
        createdAt: createdAt,
        updatedAt: new Date().toISOString()
      });
      console.log("📄 Documento do usuário criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar documento:", error);
    }
  }
};

// ========== AUTENTICAÇÃO ==========

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createUserDocument(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserDocument(userCredential.user, { name, email });
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== DADOS DO USUÁRIO ==========

export const getUserData = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFullUserData = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserData = async (uid, data) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== PERFIL DO USUÁRIO ==========

export const updateUserProfile = async (uid, profileData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (profileData.name !== undefined) updateData.name = profileData.name;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;
    if (profileData.course !== undefined) updateData.course = profileData.course;
    if (profileData.university !== undefined) updateData.university = profileData.university;
    if (profileData.semester !== undefined) updateData.semester = profileData.semester;
    if (profileData.location !== undefined) updateData.location = profileData.location;
    if (profileData.github !== undefined) updateData['socialLinks.github'] = profileData.github;
    if (profileData.linkedin !== undefined) updateData['socialLinks.linkedin'] = profileData.linkedin;
    if (profileData.instagram !== undefined) updateData['socialLinks.instagram'] = profileData.instagram;
    if (profileData.photoURL !== undefined) updateData.photoURL = profileData.photoURL;
    
    await updateDoc(userRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { success: false, error: error.message };
  }
};

// ========== FOTO DE PERFIL ==========

export const uploadProfilePhoto = async (uid, file) => {
  try {
    const storageRef = ref(storage, `profile_photos/${uid}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);
    return { success: true, photoURL };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return { success: false, error: error.message };
  }
};

export const deleteProfilePhoto = async (uid) => {
  try {
    const storageRef = ref(storage, `profile_photos/${uid}`);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    return { success: false, error: error.message };
  }
};

// ========== XP E NÍVEL ==========

const XP_PER_LEVEL = 1000;

// Única fonte de verdade para ganho de XP: soma o XP, sobe quantos níveis couberem
// e devolve o XP restante dentro do nível atual.
const applyXP = (stats, gain) => {
  const perLevel = stats.nextLevelXP || XP_PER_LEVEL;
  const total = (stats.currentXP || 0) + gain;
  return {
    currentXP: total % perLevel,
    level: (stats.level || 1) + Math.floor(total / perLevel),
  };
};

// ========== ESTATÍSTICAS DE ESTUDO ==========

export const updateStudyStats = async (uid, hours, subjectName) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentStats = data.stats || {};
      const currentSubjects = data.subjects || [];
      
      const newTotalHours = (currentStats.totalStudyHours || 0) + hours;
      
      // Calcular streak
      const today = new Date().toDateString();
      const lastStudyDate = data.lastStudyDate;
      let newStreak = currentStats.currentStreak || 0;
      
      if (lastStudyDate === today) {
        // Já estudou hoje
      } else if (lastStudyDate === new Date(Date.now() - 86400000).toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      
      const newLongestStreak = Math.max(newStreak, currentStats.longestStreak || 0);
      
      // Atualizar matérias
      const updatedSubjects = currentSubjects.map(sub => 
        sub.name === subjectName 
          ? { 
              ...sub, 
              hours: (sub.hours || 0) + hours,
              progress: Math.min(100, ((sub.hours || 0) + hours) * 2)
            }
          : sub
      );
      
      // Calcular XP
      const xpGain = hours * 10;
      const { currentXP: finalXP, level: newLevel } = applyXP(currentStats, xpGain);
      
      // Atividade
      const newActivity = {
        id: Date.now(),
        title: `Estudou ${subjectName}`,
        description: `${hours} hora(s) de estudo`,
        date: new Date().toLocaleString('pt-BR'),
        icon: '📚',
        type: 'study',
        duration: `${hours}h`,
        xpGained: xpGain
      };
      
      const currentActivities = data.recentActivities || [];
      const updatedActivities = [newActivity, ...currentActivities].slice(0, 20);
      
      await updateDoc(userRef, {
        'stats.totalStudyHours': newTotalHours,
        'stats.currentStreak': newStreak,
        'stats.longestStreak': newLongestStreak,
        'stats.currentXP': finalXP,
        'stats.level': newLevel,
        'stats.studySessions': (currentStats.studySessions || 0) + 1,
        subjects: updatedSubjects,
        recentActivities: updatedActivities,
        lastStudyDate: today,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, xpGained: xpGain, newLevel };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return { success: false, error: error.message };
  }
};

// ========== REDAÇÕES ==========

export const registerEssay = async (uid, score, mode) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentStats = data.stats || {};
      const newEssaysWritten = (currentStats.totalEssaysWritten || 0) + 1;
      
      // Calcular nova média
      const currentTotal = (currentStats.averageEssayScore || 0) * (currentStats.totalEssaysWritten || 0);
      const newAverage = (currentTotal + score) / newEssaysWritten;
      
      // XP por redação
      const xpGain = 50;
      const { currentXP: finalXP, level: newLevel } = applyXP(currentStats, xpGain);
      
      // Atividade
      const newActivity = {
        id: Date.now(),
        title: `Redação analisada`,
        description: `Nota: ${score}/1000`,
        date: new Date().toLocaleString('pt-BR'),
        icon: '✍️',
        type: 'essay',
        score: score,
        xpGained: xpGain
      };
      
      const currentActivities = data.recentActivities || [];
      const updatedActivities = [newActivity, ...currentActivities].slice(0, 20);
      
      await updateDoc(userRef, {
        'stats.totalEssaysWritten': newEssaysWritten,
        'stats.averageEssayScore': Math.round(newAverage),
        // Melhor nota na escala ENEM (0-1000); usada pelo badge "Nota 1000".
        ...(mode === 'enem' ? { 'stats.bestEnemScore': Math.max(currentStats.bestEnemScore || 0, score) } : {}),
        'stats.currentXP': finalXP,
        'stats.level': newLevel,
        recentActivities: updatedActivities,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, xpGained: xpGain };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    console.error('Erro ao registrar redação:', error);
    return { success: false, error: error.message };
  }
};

// ========== PDFs ==========

export const registerPDF = async (uid, fileName, pages) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentStats = data.stats || {};
      const newPDFsProcessed = (currentStats.totalPDFsProcessed || 0) + 1;
      
      // XP por PDF
      const xpGain = 20;
      const { currentXP: finalXP, level: newLevel } = applyXP(currentStats, xpGain);
      
      // Histórico de PDFs
      const newPDFHistory = {
        id: Date.now(),
        name: fileName,
        pages: pages,
        date: new Date().toLocaleString(),
        xpGained: xpGain
      };
      
      const currentPDFs = data.recentPDFs || [];
      const updatedPDFs = [newPDFHistory, ...currentPDFs].slice(0, 10);
      
      // Atividade
      const newActivity = {
        id: Date.now(),
        title: `PDF processado: ${fileName}`,
        description: `${pages} páginas analisadas`,
        date: new Date().toLocaleString('pt-BR'),
        icon: '📄',
        type: 'pdf',
        pages: pages,
        xpGained: xpGain
      };
      
      const currentActivities = data.recentActivities || [];
      const updatedActivities = [newActivity, ...currentActivities].slice(0, 20);
      
      await updateDoc(userRef, {
        'stats.totalPDFsProcessed': newPDFsProcessed,
        'stats.currentXP': finalXP,
        'stats.level': newLevel,
        recentPDFs: updatedPDFs,
        recentActivities: updatedActivities,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, xpGained: xpGain };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    console.error('Erro ao registrar PDF:', error);
    return { success: false, error: error.message };
  }
};
