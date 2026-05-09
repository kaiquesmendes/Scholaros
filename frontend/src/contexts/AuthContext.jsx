import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, onAuthStateChanged, getUserData } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Configurando listener do Firebase");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? `Usuário: ${firebaseUser.email}` : "Nenhum usuário");
      
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Buscar dados adicionais do Firestore
        const result = await getUserData(firebaseUser.uid);
        if (result.success) {
          setUserData(result.data);
          console.log("Dados do usuário carregados:", result.data);
        } else {
          console.log("Usuário sem dados no Firestore, criando padrão");
          setUserData({
            name: firebaseUser.displayName || 'Estudante',
            email: firebaseUser.email,
            createdAt: new Date().toISOString(),
            stats: {
              totalStudyHours: 0,
              totalEssaysWritten: 0,
              averageEssayScore: 0,
              currentStreak: 0,
              level: 1,
              xp: 0
            }
          });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
      console.log("Loading finalizado:", false);
    });

    return () => {
      console.log("AuthProvider: Limpando listener");
      unsubscribe();
    };
  }, []); // Array vazio para executar apenas uma vez

  const value = {
    user,
    userData,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};