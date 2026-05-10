// frontend/src/components/ChatMessage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart, FaReply, FaFile, FaImage, FaDownload } from 'react-icons/fa';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const ChatMessage = ({ message, isOwn, onLike, currentUserId }) => {
  const [showReplies, setShowReplies] = useState(false);
  
  const formattedTime = message.timestamp?.toDate 
    ? format(message.timestamp.toDate(), 'HH:mm', { locale: ptBR })
    : format(new Date(message.timestamp), 'HH:mm', { locale: ptBR });
  
  const formattedDate = message.timestamp?.toDate
    ? format(message.timestamp.toDate(), "dd 'de' MMMM", { locale: ptBR })
    : format(new Date(message.timestamp), "dd 'de' MMMM", { locale: ptBR });
  
  const isLiked = message.likes?.includes(currentUserId);
  const likesCount = message.likes?.length || 0;
  
  const handleFileDownload = (fileData) => {
    if (fileData?.data) {
      const link = document.createElement('a');
      link.href = fileData.data;
      link.download = fileData.name;
      link.click();
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Nome do usuário (apenas se não for própria mensagem) */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1 ml-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">
              {message.userName?.charAt(0) || '?'}
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {message.userName}
            </span>
          </div>
        )}
        
        {/* Mensagem */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white'
          }`}
        >
          <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
          
          {/* Arquivo anexado (temporário) */}
          {message.file && (
            <div className="mt-2 p-2 bg-white/10 rounded-lg flex items-center gap-2">
              {message.file.type?.startsWith('image/') ? (
                <img 
                  src={message.file.data} 
                  alt={message.file.name}
                  className="max-w-full max-h-48 rounded cursor-pointer"
                  onClick={() => window.open(message.file.data, '_blank')}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <FaFile className="text-sm" />
                  <span className="text-xs truncate max-w-[150px]">{message.file.name}</span>
                  <button
                    onClick={() => handleFileDownload(message.file)}
                    className="ml-2 p-1 hover:bg-white/20 rounded transition-all"
                  >
                    <FaDownload size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Ações */}
        <div className={`flex items-center gap-3 mt-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <button
            onClick={() => onLike?.(message.id)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-all"
          >
            {isLiked ? <FaHeart className="text-red-500" size={12} /> : <FaRegHeart size={12} />}
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
          <span className="text-xs text-gray-400">{formattedTime}</span>
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;