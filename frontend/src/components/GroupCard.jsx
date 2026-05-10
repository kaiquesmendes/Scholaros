// frontend/src/components/GroupCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaUserPlus, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const GroupCard = ({ group, currentUserId, onJoin, onLeave, onDelete }) => {
  const navigate = useNavigate();
  const isMember = group.members?.includes(currentUserId);
  const isOwner = group.ownerId === currentUserId;
  
  const handleClick = () => {
    if (isMember) {
      navigate(`/groups/${group.id}`);
    }
  };
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg transition-all ${
        isMember ? 'cursor-pointer hover:shadow-xl' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{group.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{group.description}</p>
        </div>
        <div className="flex items-center gap-1 text-sm text-purple-600">
          <FaUsers size={14} />
          <span>{group.members?.length || 0}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">
            {group.ownerName?.charAt(0) || '?'}
          </div>
          <span className="text-xs text-gray-500">Criado por {group.ownerName}</span>
        </div>
        
        <div className="flex gap-2">
          {!isMember && (
            <button
              onClick={(e) => { e.stopPropagation(); onJoin?.(group.id); }}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-all flex items-center gap-1"
            >
              <FaUserPlus size={10} /> Entrar
            </button>
          )}
          {isMember && !isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); onLeave?.(group.id); }}
              className="px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 transition-all flex items-center gap-1"
            >
              <FaSignOutAlt size={10} /> Sair
            </button>
          )}
          {isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(group.id); }}
              className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-all flex items-center gap-1"
            >
              <FaTrash size={10} /> Deletar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GroupCard;