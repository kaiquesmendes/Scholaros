import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const SocialNetwork = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rede Social Acadêmica</h1>
          <p className="text-gray-600 mt-2">Conecte-se com outros estudantes</p>
          <div className="mt-8 bg-white dark:bg-dark-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">Em desenvolvimento - Feed de posts e interações em breve!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialNetwork;