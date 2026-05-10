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
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

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
export const auth = getAuth(app);
export const db = getFirestore(app);

// Providers para login social
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Exportar funções básicas
export { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInWithPopup
};

// ========== FUNÇÃO DE CRIAÇÃO DE USUÁRIO (ATUALIZADA) ==========
const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date().toISOString();
    
    try {
      await setDoc(userRef, {
        name: displayName || additionalData.name || 'Estudante',
        email: email || additionalData.email,
        photoURL: photoURL || null,
        bio: additionalData.bio || 'Estudante de ' + (additionalData.course || 'ensino superior'),
        course: additionalData.course || '',
        university: additionalData.university || '',
        semester: additionalData.semester || '1º semestre',
        location: additionalData.location || '',
        joinDate: createdAt,
        socialLinks: {
          github: additionalData.github || '',
          linkedin: additionalData.linkedin || '',
          instagram: additionalData.instagram || ''
        },
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
        subjects: [
          { name: 'Matemática', progress: 0, color: '#8b5cf6', hours: 0, goal: 50 },
          { name: 'Português', progress: 0, color: '#ec4899', hours: 0, goal: 50 },
          { name: 'Redação', progress: 0, color: '#06b6d4', hours: 0, goal: 50 },
          { name: 'Física', progress: 0, color: '#f59e0b', hours: 0, goal: 50 },
          { name: 'Química', progress: 0, color: '#10b981', hours: 0, goal: 50 }
        ],
        badges: [
          { id: 1, name: 'Primeiros Passos', description: 'Complete seu primeiro estudo', icon: '🌟', earned: false, date: null },
          { id: 2, name: 'Dedicado', description: '30 dias de estudo consecutivo', icon: '🔥', earned: false, date: null },
          { id: 3, name: 'Mestre das Redações', description: '10 redações analisadas', icon: '✍️', earned: false, date: null },
          { id: 4, name: 'Leitor Voraz', description: '50 PDFs processados', icon: '📚', earned: false, date: null },
          { id: 5, name: 'Nota 1000', description: 'Redação nota 1000', icon: '🏆', earned: false, date: null }
        ],
        recentActivities: [
          { 
            id: Date.now(), 
            title: 'Bem-vindo ao ScholarOS!', 
            description: 'Complete seu primeiro estudo para ganhar XP', 
            date: new Date().toLocaleString('pt-BR'), 
            icon: '🎉', 
            type: 'welcome' 
          }
        ],
        createdAt: createdAt,
        updatedAt: new Date().toISOString()
      });
      console.log("📄 Documento do usuário criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar documento:", error);
    }
  }
};

// ========== LOGIN COM EMAIL/SENHA ==========
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createUserDocument(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== CADASTRO COM EMAIL/SENHA ==========
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

// ========== LOGIN COM GOOGLE ==========
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== LOGIN COM GITHUB ==========
export const loginWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== LOGOUT ==========
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== RESETAR SENHA ==========
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== BUSCAR DADOS DO USUÁRIO ==========
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

// ========== ATUALIZAR DADOS DO USUÁRIO ==========
export const updateUserData = async (uid, data) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== NOVAS FUNÇÕES (ADICIONADAS) ==========

// Atualizar estatísticas de estudo
export const updateStudyStats = async (uid, hours, subjectName) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentStats = data.stats || {};
      const currentSubjects = data.subjects || [];
      
      const newTotalHours = (currentStats.totalStudyHours || 0) + hours;
      
      const lastStudyDate = data.lastStudyDate;
      const today = new Date().toDateString();
      let newStreak = currentStats.currentStreak || 0;
      
      if (lastStudyDate === today) {
        // já estudou hoje
      } else if (lastStudyDate === new Date(Date.now() - 86400000).toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      
      const newLongestStreak = Math.max(newStreak, currentStats.longestStreak || 0);
      
      const updatedSubjects = currentSubjects.map(sub => 
        sub.name === subjectName 
          ? { 
              ...sub, 
              hours: (sub.hours || 0) + hours,
              progress: Math.min(100, (sub.hours || 0) + hours)
            }
          : sub
      );
      
      const xpGain = hours * 10;
      const newXP = (currentStats.currentXP || 0) + xpGain;
      const nextLevelXP = currentStats.nextLevelXP || 1000;
      let newLevel = currentStats.level || 1;
      let finalXP = newXP;
      
      if (newXP >= nextLevelXP) {
        newLevel += Math.floor(newXP / nextLevelXP);
        finalXP = newXP % nextLevelXP;
      }
      
      const newActivity = {
        id: Date.now(),
        title: `Estudou ${subjectName}`,
        description: `${hours} hora(s) de estudo`,
        date: new Date().toLocaleString('pt-BR'),
        icon: '📚',
        type: 'study',
        duration: `${hours}h`
      };
      
      const currentActivities = data.recentActivities || [];
      const updatedActivities = [newActivity, ...currentActivities].slice(0, 10);
      
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
      
      return { success: true };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return { success: false, error: error.message };
  }
};

// Atualizar perfil do usuário
export const updateUserProfile = async (uid, profileData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      name: profileData.name,
      bio: profileData.bio,
      course: profileData.course,
      university: profileData.university,
      semester: profileData.semester,
      location: profileData.location,
      'socialLinks.github': profileData.github,
      'socialLinks.linkedin': profileData.linkedin,
      'socialLinks.instagram': profileData.instagram,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { success: false, error: error.message };
  }
};

// Buscar dados completos do usuário
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