// frontend/src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBell, FaUserCircle, FaMoon, FaSun, FaSearch, 
  FaUser, FaCog, FaSignOutAlt, FaChartLine, 
  FaBook, FaComments, FaUsers, FaFileAlt
} from 'react-icons/fa';
import { getFullUserData, logoutUser } from '../config/firebase';
import toast from 'react-hot-toast';

const Header = ({ user, userData: propUserData, onLogout }) => {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (propUserData) {
        setUserData(propUserData);
      } else if (user?.uid) {
        const result = await getFullUserData(user.uid);
        if (result.success) {
          setUserData(result.data);
        }
      }
    };
    fetchUserData();
  }, [user, propUserData]);

  // Buscar notificações das atividades recentes
  useEffect(() => {
    if (userData?.recentActivities) {
      const recentNotifications = userData.recentActivities.slice(0, 5).map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        time: activity.date,
        read: false,
        icon: activity.icon || getActivityIcon(activity.type),
        type: activity.type,
        xpGained: activity.xpGained
      }));
      setNotifications(recentNotifications);
      setUnreadCount(recentNotifications.filter(n => !n.read).length);
    }
  }, [userData]);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'essay': return '✍️';
      case 'pdf': return '📄';
      case 'study': return '📚';
      case 'badge': return '🏆';
      default: return '📌';
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  // Carregar tema salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      const result = await logoutUser();
      if (result.success) {
        toast.success('Logout realizado!');
        window.location.href = '/login';
      } else {
        toast.error('Erro ao fazer logout');
      }
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success('Notificações marcadas como lidas');
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 1) {
      // Simular busca (pode ser integrada com Firestore depois)
      const results = [
        { type: 'essay', title: 'Redação ENEM', path: '/essay' },
        { type: 'pdf', title: 'PDF Processados', path: '/pdfs' },
        { type: 'profile', title: 'Meu Perfil', path: '/profile' },
        { type: 'groups', title: 'Grupos de Estudo', path: '/groups' },
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Calcular nível e XP
  const userLevel = userData?.stats?.level || 1;
  const currentXP = userData?.stats?.currentXP || 0;
  const nextLevelXP = userData?.stats?.nextLevelXP || 1000;
  const xpProgress = (currentXP / nextLevelXP) * 100;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Logo/Brand (mobile) */}
          <div className="lg:hidden flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ScholarOS
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Pesquisar matérias, anotações, redações..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                {searchResults.map((result, idx) => (
                  <Link
                    key={idx}
                    to={result.path}
                    onClick={() => setShowSearchResults(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <span className="text-xl">
                      {result.type === 'essay' && '✍️'}
                      {result.type === 'pdf' && '📄'}
                      {result.type === 'profile' && '👤'}
                      {result.type === 'groups' && '👥'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{result.title}</p>
                      <p className="text-xs text-gray-500">Clique para acessar</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* XP Bar (Desktop) */}
            <div className="hidden md:block w-32">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-600 dark:text-gray-400">Nv.{userLevel}</span>
                <span className="text-purple-600 text-xs font-semibold">{currentXP}/{nextLevelXP}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              aria-label="Alternar tema"
            >
              {isDark ? (
                <FaSun className="text-yellow-500 text-lg" />
              ) : (
                <FaMoon className="text-gray-600 text-lg" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all relative"
                aria-label="Notificações"
              >
                <FaBell className="text-gray-600 dark:text-gray-400 text-lg" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Notificações</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-purple-600 hover:text-purple-700"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer ${!notif.read ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-lg">
                              {notif.icon}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 dark:text-white">{notif.title}</p>
                              {notif.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{notif.description}</p>
                              )}
                              {notif.xpGained && (
                                <p className="text-xs text-green-600 mt-1">+{notif.xpGained} XP</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="text-4xl mb-2">🔔</div>
                        <p className="text-gray-500 text-sm">Nenhuma notificação</p>
                        <p className="text-xs text-gray-400">Complete atividades para ver notificações</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <Link 
                      to="/profile"
                      onClick={() => setShowNotifications(false)}
                      className="block text-center text-xs text-purple-600 hover:text-purple-700 py-1"
                    >
                      Ver todas as atividades
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 hover:opacity-80 transition-all"
                aria-label="Menu do usuário"
              >
                {userData?.photoURL ? (
                  <img 
                    src={userData.photoURL} 
                    alt={userData.name || user?.email}
                    className="w-9 h-9 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <FaUserCircle className="text-3xl text-gray-400" />
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Estudante'}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Nível {userLevel}</p>
                    <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${xpProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    {userData?.photoURL ? (
                      <img 
                        src={userData.photoURL} 
                        alt={userData.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="text-4xl text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {userData?.name || user?.displayName || 'Estudante'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link 
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <FaUser className="text-gray-500" />
                      <span className="text-sm">Meu Perfil</span>
                    </Link>
                    <Link 
                      to="/essay"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <FaFileAlt className="text-gray-500" />
                      <span className="text-sm">Minhas Redações</span>
                    </Link>
                    <Link 
                      to="/pdfs"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <FaBook className="text-gray-500" />
                      <span className="text-sm">Meus PDFs</span>
                    </Link>
                    <Link 
                      to="/groups"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <FaUsers className="text-gray-500" />
                      <span className="text-sm">Grupos de Estudo</span>
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-red-600"
                    >
                      <FaSignOutAlt className="text-red-500" />
                      <span className="text-sm">Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;