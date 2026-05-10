// frontend/src/pages/SocialNetwork.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaImage, FaPaperclip, FaTimes, FaSmile } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatMessage from '../components/ChatMessage';
import { sendGlobalMessage, listenGlobalMessages, likeMessage } from '../services/chatService';
import { getFullUserData } from '../config/firebase';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';

const SocialNetwork = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userData, setUserData] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      const result = await getFullUserData(user.uid);
      if (result.success) {
        setUserData(result.data);
      }
    };
    fetchUserData();
  }, [user]);

  // Escutar mensagens em tempo real
  useEffect(() => {
    const unsubscribe = listenGlobalMessages((newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });
    
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    const result = await sendGlobalMessage(
      user.uid,
      userData?.name || user.email?.split('@')[0] || 'Estudante',
      userData?.photoURL,
      newMessage.trim()
    );
    
    if (result.success) {
      setNewMessage('');
      inputRef.current?.focus();
    } else {
      toast.error('Erro ao enviar mensagem');
    }
    setSending(false);
  };

  const handleLike = async (messageId) => {
    await likeMessage(messageId, user.uid);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        {/* Header da Rede Social */}
        <div className="bg-white dark:bg-gray-800 border-b px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🌐 Rede Social Acadêmica
          </h1>
          <p className="text-gray-500 text-sm mt-1">Conecte-se com outros estudantes</p>
        </div>
        
        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="text-6xl mb-4">💬</div>
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a compartilhar algo!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={msg.userId === user.uid}
                onLike={handleLike}
                currentUserId={user.uid}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input de mensagem */}
        <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Compartilhe algo com a comunidade..."
                rows={1}
                className="w-full px-4 py-3 pr-20 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <div className="absolute right-2 bottom-2 flex gap-1">
                <button className="p-2 text-gray-400 hover:text-purple-600 transition-all rounded-lg">
                  <FaImage size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-purple-600 transition-all rounded-lg">
                  <FaSmile size={18} />
                </button>
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaPaperPlane size={16} /> Enviar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            🌟 Compartilhe dúvidas, dicas de estudo e conteúdos relevantes
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialNetwork;