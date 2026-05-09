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

// Função para criar usuário no Firestore
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
        createdAt: createdAt,
        stats: {
          totalStudyHours: 0,
          totalEssaysWritten: 0,
          averageEssayScore: 0,
          currentStreak: 0,
          level: 1,
          xp: 0
        }
      });
    } catch (error) {
      console.error("Erro ao criar documento:", error);
    }
  }
};

// Login com Email/Senha
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createUserDocument(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Cadastro com Email/Senha
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

// Login com Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Login com GitHub
export const loginWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    await createUserDocument(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resetar senha
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Buscar dados do usuário
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

// Atualizar dados do usuário
export const updateUserData = async (uid, data) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};