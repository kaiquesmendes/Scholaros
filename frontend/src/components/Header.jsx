import React, { useState } from 'react';
import { FaBell, FaUserCircle, FaMoon, FaSun, FaSearch } from 'react-icons/fa';

const Header = ({ user }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar matérias, anotações..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            {isDark ? <FaSun className="text-yellow-500 text-xl" /> : <FaMoon className="text-gray-600 text-xl" />}
          </button>
          
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all relative">
            <FaBell className="text-gray-600 dark:text-gray-400 text-xl" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <FaUserCircle className="text-3xl text-gray-400" />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.displayName || user?.email?.split('@')[0] || 'Estudante'}
              </p>
              <p className="text-xs text-gray-500">Nível 12 ⭐</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;