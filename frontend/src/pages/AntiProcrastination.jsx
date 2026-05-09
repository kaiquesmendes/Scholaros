import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const AntiProcrastination = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sistema Anti-Procrastinação</h1>
          <p className="text-gray-600 mt-2">Ferramentas para manter o foco e produtividade</p>
          <div className="mt-8 bg-white dark:bg-dark-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">Em desenvolvimento - Técnicas de produtividade em breve!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AntiProcrastination;