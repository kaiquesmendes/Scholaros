// frontend/src/pages/StudyGroups.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaPaperPlane, FaImage, FaTimes, FaUsers, FaArrowLeft } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatMessage from '../components/ChatMessage';
import GroupCard from '../components/GroupCard';
import { 
  createGroup, listenUserGroups, listenAllGroups, joinGroup, leaveGroup, 
  deleteGroup, sendGroupMessage, listenGroupMessages, likeMessage,
  getFullUserData, auth
} from '../services/chatService';
import toast from 'react-hot-toast';

// Componente de criação de grupo
const CreateGroupModal = ({ isOpen, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = async () => {
    if (!groupName.trim()) {
      toast.error('Digite um nome para o grupo');
      return;
    }
    await onCreate(groupName, description);
    setGroupName('');
    setDescription('');
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Criar Grupo de Estudo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
        </div>
        <input type="text" placeholder="Nome do grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700" />
        <textarea placeholder="Descrição do grupo (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700" />
        <button onClick={handleSubmit} className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">Criar Grupo</button>
      </motion.div>
    </div>
  );
};

// Página de chat do grupo
const GroupChat = ({ user, userData, groupId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [group, setGroup] = useState(null);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    const fetchGroup = async () => {
      const { getDoc, doc, db } = await import('../config/firebase');
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        setGroup({ id: groupDoc.id, ...groupDoc.data() });
      }
    };
    fetchGroup();
    
    const unsubscribe = listenGroupMessages(groupId, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    
    return () => unsubscribe();
  }, [groupId]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await sendGroupMessage(groupId, user.uid, userData?.name || user.email?.split('@')[0], userData?.photoURL, newMessage.trim());
    setNewMessage('');
    setSending(false);
  };
  
  const handleLike = async (messageId) => {
    await likeMessage(messageId, user.uid);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="bg-purple-50 dark:bg-gray-800 p-4 border-b flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-purple-100 rounded-lg"><FaArrowLeft /></button>
        <div>
          <h2 className="font-bold text-gray-800 dark:text-white">{group?.name || 'Carregando...'}</h2>
          <p className="text-xs text-gray-500">{group?.members?.length || 0} membros</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} isOwn={msg.userId === user.uid} onLike={handleLike} currentUserId={user.uid} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex gap-3">
          <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} placeholder="Digite sua mensagem..." rows={1} className="flex-1 px-4 py-2 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700" />
          <button onClick={handleSendMessage} disabled={!newMessage.trim() || sending} className="px-4 py-2 bg-purple-600 text-white rounded-xl"><FaPaperPlane /></button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
const StudyGroups = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('my');
  const navigate = useNavigate();
  const { groupId } = useParams();
  
  useEffect(() => {
    const fetchUserData = async () => {
      const result = await getFullUserData(user.uid);
      if (result.success) setUserData(result.data);
    };
    fetchUserData();
    
    const unsubscribeMy = listenUserGroups(user.uid, setMyGroups);
    const unsubscribeAll = listenAllGroups(setAllGroups);
    
    return () => {
      unsubscribeMy();
      unsubscribeAll();
    };
  }, [user]);
  
  const handleCreateGroup = async (name, description) => {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await createGroup(groupId, {
      name: name,
      description: description,
      ownerId: user.uid,
      ownerName: userData?.name || user.email?.split('@')[0],
      createdAt: new Date().toISOString(),
      members: [user.uid]
    });
    toast.success('Grupo criado com sucesso!');
  };
  
  const handleJoinGroup = async (groupId) => {
    await joinGroup(groupId, user.uid);
    toast.success('Você entrou no grupo!');
  };
  
  const handleLeaveGroup = async (groupId) => {
    await leaveGroup(groupId, user.uid);
    toast.success('Você saiu do grupo');
  };
  
  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Tem certeza que deseja deletar este grupo?')) {
      await deleteGroup(groupId, user.uid);
      toast.success('Grupo deletado');
    }
  };
  
  if (groupId) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <GroupChat user={user} userData={userData} groupId={groupId} />
        </div>
      </div>
    );
  }
  
  const displayGroups = activeTab === 'my' ? myGroups : allGroups.filter(g => !myGroups.some(mg => mg.id === g.id));
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">👨‍👩‍👧‍👦 Grupos de Estudo</h1>
              <p className="text-gray-500 mt-1">Estude em grupo e compartilhe conhecimento</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-purple-700"><FaPlus /> Criar Grupo</button>
          </div>
          
          <div className="flex gap-3 mb-6 border-b">
            <button onClick={() => setActiveTab('my')} className={`pb-2 px-4 transition-all ${activeTab === 'my' ? 'border-b-2 border-purple-600 text-purple-600 font-semibold' : 'text-gray-500'}`}>Meus Grupos ({myGroups.length})</button>
            <button onClick={() => setActiveTab('all')} className={`pb-2 px-4 transition-all ${activeTab === 'all' ? 'border-b-2 border-purple-600 text-purple-600 font-semibold' : 'text-gray-500'}`}>Descobrir Grupos</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayGroups.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">{activeTab === 'my' ? '🔍' : '🚀'}</div>
                <p>{activeTab === 'my' ? 'Você ainda não entrou em nenhum grupo' : 'Nenhum grupo disponível'}</p>
                <p className="text-sm mt-1">{activeTab === 'my' ? 'Explore grupos para começar a estudar em equipe!' : 'Crie o primeiro grupo de estudo!'}</p>
              </div>
            ) : (
              displayGroups.map((group) => (
                <GroupCard key={group.id} group={group} currentUserId={user.uid} onJoin={handleJoinGroup} onLeave={handleLeaveGroup} onDelete={handleDeleteGroup} />
              ))
            )}
          </div>
        </div>
        <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateGroup} />
      </div>
    </div>
  );
};

export default StudyGroups;