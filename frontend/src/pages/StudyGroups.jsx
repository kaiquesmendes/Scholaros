// frontend/src/pages/StudyGroups.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaPaperPlane, FaArrowLeft, FaUsers, 
  FaImage, FaSmile, FaTimes, FaTrash, FaSignOutAlt,
  FaUserPlus, FaUserMinus, FaCrown, FaFileAlt,
  FaPaperclip, FaLink, FaReply, FaEllipsisH
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatMessage from '../components/ChatMessage';
import GroupCard from '../components/GroupCard';
import { 
  createGroup, listenUserGroups, listenAllGroups, joinGroup, leaveGroup, 
  deleteGroup, sendGroupMessage, listenGroupMessages, likeMessage,
  getGroupMembers, addGroupMember, removeGroupMember
} from '../services/chatService';
import { getFullUserData, getDoc, doc, db } from '../config/firebase';
import toast from 'react-hot-toast';

// Componente de criação de grupo melhorado
const CreateGroupModal = ({ isOpen, onClose, onCreate, user }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('geral');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const categories = [
    { id: 'geral', label: '📚 Geral', color: 'purple' },
    { id: 'matematica', label: '📐 Matemática', color: 'blue' },
    { id: 'portugues', label: '📖 Português', color: 'green' },
    { id: 'redacao', label: '✍️ Redação', color: 'pink' },
    { id: 'ciencias', label: '🔬 Ciências', color: 'yellow' },
    { id: 'humanas', label: '🏛️ Humanas', color: 'orange' },
    { id: 'programacao', label: '💻 Programação', color: 'cyan' }
  ];

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      toast.error('Digite um nome para o grupo');
      return;
    }
    await onCreate(groupName, description, category, isPrivate, tags);
    setGroupName('');
    setDescription('');
    setCategory('geral');
    setIsPrivate(false);
    setTags([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Criar Grupo de Estudo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome do grupo *</label>
            <input
              type="text"
              placeholder="Ex: Matemática ENEM 2024"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Descrição</label>
            <textarea
              placeholder="Descreva o objetivo do grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    category === cat.id
                      ? `bg-${cat.color === 'purple' ? 'purple' : cat.color === 'blue' ? 'blue' : cat.color === 'green' ? 'green' : cat.color === 'pink' ? 'pink' : cat.color === 'yellow' ? 'yellow' : cat.color === 'orange' ? 'orange' : 'cyan'}-600 text-white`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Grupo privado (apenas convite)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Adicionar tag (ex: ENEM, Vestibular)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 text-sm"
              />
              <button onClick={addTag} className="px-3 py-2 bg-purple-600 text-white rounded-lg">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs flex items-center gap-1">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">Criar Grupo</button>
        </div>
      </motion.div>
    </div>
  );
};

// Componente de visualização de membros
const MembersModal = ({ isOpen, onClose, members, groupId, currentUserId, isOwner, onRemoveMember }) => {
  const [memberDetails, setMemberDetails] = useState([]);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      const details = [];
      for (const memberId of members) {
        const result = await getFullUserData(memberId);
        if (result.success) {
          details.push({ id: memberId, ...result.data });
        }
      }
      setMemberDetails(details);
    };
    if (isOpen) fetchMemberDetails();
  }, [isOpen, members]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Membros ({members.length})
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
          {memberDetails.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center gap-3">
                {member.photoURL ? (
                  <img src={member.photoURL} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-bold">
                      {member.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.course || 'Estudante'}</p>
                </div>
              </div>
              {member.id === groupId?.ownerId && (
                <FaCrown className="text-yellow-500" title="Criador" />
              )}
              {isOwner && member.id !== currentUserId && (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Remover membro"
                >
                  <FaUserMinus />
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Página de chat do grupo melhorada
const GroupChat = ({ user, userData, groupId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [group, setGroup] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchGroup = async () => {
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
    if (!newMessage.trim() && !replyTo) return;
    
    let text = newMessage;
    if (replyTo) {
      text = `Replying to @${replyTo.userName}: "${replyTo.text.substring(0, 50)}"\n\n${newMessage}`;
    }
    
    setSending(true);
    await sendGroupMessage(groupId, user.uid, userData?.name || user.email?.split('@')[0], userData?.photoURL, text);
    setNewMessage('');
    setReplyTo(null);
    setSending(false);
  };

  const handleLike = async (messageId) => {
    await likeMessage(messageId, user.uid);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendGroupMessage(groupId, user.uid, userData?.name, userData?.photoURL, `📎 ${file.name}`, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
    setShowFileMenu(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isOwner = group?.ownerId === user.uid;

  return (
    <div className="flex flex-col h-full">
      {/* Header do Chat */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/20 rounded-lg transition-all">
            <FaArrowLeft />
          </button>
          <div>
            <h2 className="font-bold text-lg">{group?.name || 'Carregando...'}</h2>
            <p className="text-xs opacity-80">{group?.members?.length || 0} membros • {group?.category || 'Geral'}</p>
          </div>
        </div>
        <button onClick={() => setShowMembers(true)} className="p-2 hover:bg-white/20 rounded-lg transition-all">
          <FaUsers size={18} />
        </button>
      </div>

      {/* Descrição do Grupo */}
      {group?.description && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 text-sm text-gray-600 dark:text-gray-400 border-b">
          {group.description}
        </div>
      )}

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">💬</div>
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id || idx}
              message={msg}
              isOwn={msg.userId === user.uid}
              onLike={handleLike}
              onReply={setReplyTo}
              currentUserId={user.uid}
            />
          ))
        )}
        {replyTo && (
          <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg flex justify-between items-center text-sm">
            <span>Respondendo para @{replyTo.userName}</span>
            <button onClick={() => setReplyTo(null)} className="text-red-500">
              <FaTimes />
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="w-full px-4 py-3 pr-20 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <button
                onClick={() => setShowFileMenu(!showFileMenu)}
                className="p-1.5 text-gray-400 hover:text-purple-600 transition-all rounded-lg"
              >
                <FaPaperclip size={16} />
              </button>
              {showFileMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg w-full"
                  >
                    <FaImage /> Imagem
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg w-full">
                    <FaFileAlt /> Documento
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            <FaPaperPlane size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          💡 Dica: Use @ para mencionar alguém
        </p>
      </div>

      {/* Modal de Membros */}
      <MembersModal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        members={group?.members || []}
        groupId={group}
        currentUserId={user.uid}
        isOwner={isOwner}
        onRemoveMember={async (memberId) => {
          await removeGroupMember(groupId, memberId);
          toast.success('Membro removido');
          setShowMembers(false);
        }}
      />
    </div>
  );
};

// Componente principal StudyGroups
const StudyGroups = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('my');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const { groupId } = useParams();

  useEffect(() => {
    const fetchUserData = async () => {
      const result = await getFullUserData(user.uid);
      if (result.success) setUserData(result.data);
    };
    fetchUserData();

    const unsubscribeMy = listenUserGroups(user.uid, (groups) => {
      setMyGroups(groups);
    });
    const unsubscribeAll = listenAllGroups((groups) => {
      setAllGroups(groups);
    });

    return () => {
      unsubscribeMy();
      unsubscribeAll();
    };
  }, [user]);

  const handleCreateGroup = async (name, description, category, isPrivate, tags) => {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await createGroup(groupId, {
      name: name,
      description: description,
      category: category,
      isPrivate: isPrivate,
      tags: tags,
      ownerId: user.uid,
      ownerName: userData?.name || user.email?.split('@')[0],
      createdAt: new Date().toISOString(),
      members: [user.uid]
    });
    toast.success('Grupo criado com sucesso!');
    setActiveTab('my');
  };

  const handleJoinGroup = async (groupId) => {
    await joinGroup(groupId, user.uid);
    toast.success('Você entrou no grupo!');
  };

  const handleLeaveGroup = async (groupId) => {
    if (window.confirm('Tem certeza que deseja sair do grupo?')) {
      await leaveGroup(groupId, user.uid);
      toast.success('Você saiu do grupo');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Tem certeza que deseja deletar este grupo? Essa ação não pode ser desfeita.')) {
      await deleteGroup(groupId, user.uid);
      toast.success('Grupo deletado');
    }
  };

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'geral', label: '📚 Geral' },
    { id: 'matematica', label: '📐 Matemática' },
    { id: 'portugues', label: '📖 Português' },
    { id: 'redacao', label: '✍️ Redação' },
    { id: 'ciencias', label: '🔬 Ciências' },
    { id: 'humanas', label: '🏛️ Humanas' },
    { id: 'programacao', label: '💻 Programação' }
  ];

  const filteredGroups = (activeTab === 'my' ? myGroups : allGroups.filter(g => !myGroups.some(mg => mg.id === g.id)))
    .filter(group => {
      if (searchTerm && !group.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedCategory !== 'all' && group.category !== selectedCategory) return false;
      return true;
    });

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto">
        <Header user={user} />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  👨‍👩‍👧‍👦 Grupos de Estudo
                </h1>
                <p className="text-gray-500 mt-1">Estude em grupo, troque ideias e compartilhe conhecimento</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all"
              >
                <FaPlus /> Criar Grupo
              </button>
            </div>

            {/* Busca e Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Buscar grupos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-6 border-b">
              <button
                onClick={() => setActiveTab('my')}
                className={`pb-2 px-4 transition-all ${
                  activeTab === 'my'
                    ? 'border-b-2 border-purple-600 text-purple-600 font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Meus Grupos ({myGroups.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-2 px-4 transition-all ${
                  activeTab === 'all'
                    ? 'border-b-2 border-purple-600 text-purple-600 font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Descobrir Grupos
              </button>
            </div>

            {/* Lista de Grupos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroups.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">{activeTab === 'my' ? '🔍' : '🚀'}</div>
                  <p>{activeTab === 'my' ? 'Você ainda não entrou em nenhum grupo' : 'Nenhum grupo encontrado'}</p>
                  <p className="text-sm mt-1">
                    {activeTab === 'my'
                      ? 'Explore grupos para começar a estudar em equipe!'
                      : 'Tente outros filtros ou crie o primeiro grupo!'}
                  </p>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    currentUserId={user.uid}
                    onJoin={handleJoinGroup}
                    onLeave={handleLeaveGroup}
                    onDelete={handleDeleteGroup}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
          user={user}
        />
      </div>
    </div>
  );
};

export default StudyGroups;