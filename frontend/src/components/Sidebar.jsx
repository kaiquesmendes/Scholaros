import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaFeatherAlt, FaFilePdf, FaBrain, FaUsers, FaUserFriends, FaRocket, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { logoutUser } from '../config/firebase';
import toast from 'react-hot-toast';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logout realizado!');
      navigate('/login');
    } else {
      toast.error('Erro ao fazer logout');
    }
  };

  const menuItems = [
    { path: '/', icon: <FaHome />, label: 'Dashboard' },
    { path: '/essay', icon: <FaFeatherAlt />, label: 'Redação IA' },
    { path: '/pdfs', icon: <FaFilePdf />, label: 'PDFs' },
    { path: '/cognitive-map', icon: <FaBrain />, label: 'Mapa Cognitivo' },
    { path: '/profile', icon: <FaUser />, label: 'Meu Perfil' },
    { path: '/social', icon: <FaUsers />, label: 'Rede Social' },
    { path: '/groups', icon: <FaUserFriends />, label: 'Grupos' },
    { path: '/productivity', icon: <FaRocket />, label: 'Produtividade' },
    
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          ScholarOS
        </h1>
        <p className="text-xs text-gray-500 mt-1">Sistema Operacional Acadêmico</p>
        {user && (
          <p className="text-xs text-purple-600 mt-2 truncate">
            {user.email}
          </p>
        )}
      </div>
      
      <nav className="flex-1 p-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
              location.pathname === item.path
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <FaSignOutAlt />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;