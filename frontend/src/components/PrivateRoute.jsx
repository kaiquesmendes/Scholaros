import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log("PrivateRoute - isAuthenticated:", isAuthenticated, "loading:", loading);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated) {
    console.log("Usuário não autenticado, redirecionando para /login");
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, mostra a página
  console.log("Usuário autenticado, renderizando página");
  return children;
};

export default PrivateRoute;