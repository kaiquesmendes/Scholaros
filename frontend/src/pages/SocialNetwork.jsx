// frontend/src/pages/SocialNetwork.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPaperPlane, FaImage, FaSmile, FaHeart, FaRegHeart, 
  FaComment, FaShare, FaUserPlus, FaUserCheck, FaSearch,
  FaTimes, FaTrash, FaEdit, FaEllipsisH, FaVideo,
  FaRegSmile, FaPaperclip, FaUsers, FaUserCircle
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getFullUserData, updateUserData } from '../config/firebase';
import { 
  sendGlobalMessage, listenGlobalMessages, likeMessage, 
  createPost, listenPosts, likePost, addComment, 
  followUser, unfollowUser, searchUsers
} from '../services/chatService';
import toast from 'react-hot-toast';

const SocialNetwork = ({ user }) => {
  // Estados principais
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // feed, chat, friends
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [newPrivateMessage, setNewPrivateMessage] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const feedRef = useRef(null);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      const result = await getFullUserData(user.uid);
      if (result.success) {
        setUserData(result.data);
        setFriends(result.data.friends || []);
      }
    };
    fetchUserData();
  }, [user]);

  // Buscar posts do feed global
  useEffect(() => {
    const unsubscribe = listenPosts((newPosts) => {
      setPosts(newPosts);
    });
    return () => unsubscribe();
  }, []);

  // Buscar mensagens do chat global
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

  // Buscar usuários
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      toast.error('Digite pelo menos 2 caracteres');
      return;
    }
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
  };

  // Seguir usuário
  const handleFollow = async (targetUserId) => {
    await followUser(user.uid, targetUserId);
    setFriends([...friends, targetUserId]);
    toast.success('Usuário seguido!');
  };

  // Deixar de seguir
  const handleUnfollow = async (targetUserId) => {
    await unfollowUser(user.uid, targetUserId);
    setFriends(friends.filter(id => id !== targetUserId));
    toast.success('Deixou de seguir');
  };

  // Criar post
  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      toast.error('Escreva algo para postar');
      return;
    }
    const result = await createPost(user.uid, userData?.name || user.email, userData?.photoURL, newPost, newPostImage);
    if (result.success) {
      setNewPost('');
      setNewPostImage(null);
      setShowNewPostModal(false);
      toast.success('Post publicado!');
    } else {
      toast.error('Erro ao publicar');
    }
  };

  // Curtir post
  const handleLikePost = async (postId) => {
    await likePost(postId, user.uid);
  };

  // Adicionar comentário
  const handleAddComment = async (postId, comment) => {
    if (!comment.trim()) return;
    await addComment(postId, user.uid, userData?.name || user.email, comment);
  };

  // Enviar mensagem global
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Componente de Post
  const PostCard = ({ post }) => {
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const isLiked = post.likes?.includes(user.uid);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 overflow-hidden"
      >
        {/* Header do Post */}
        <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            {post.userPhoto ? (
              <img src={post.userPhoto} alt={post.userName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <FaUserCircle className="text-3xl text-gray-400" />
            )}
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{post.userName}</p>
              <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <FaEllipsisH />
          </button>
        </div>

        {/* Conteúdo do Post */}
        <div className="p-4">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
          {post.image && (
            <img src={post.image} alt="Post" className="mt-3 rounded-xl max-h-96 w-full object-cover" />
          )}
        </div>

        {/* Ações do Post */}
        <div className="px-4 py-2 border-t dark:border-gray-700 flex justify-around">
          <button 
            onClick={() => handleLikePost(post.id)}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-all"
          >
            {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
            <span>{post.likes?.length || 0}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-all"
          >
            <FaComment /> {post.comments?.length || 0}
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-all">
            <FaShare /> Compartilhar
          </button>
        </div>

        {/* Comentários */}
        {showComments && (
          <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
              {post.comments?.map((comment, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <p className="text-xs font-semibold text-purple-600">{comment.userName}:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
              />
              <button
                onClick={() => {
                  handleAddComment(post.id, newComment);
                  setNewComment('');
                }}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Componente de Chat Message
  const ChatMessageComponent = ({ message }) => (
    <div className={`flex ${message.userId === user.uid ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] ${message.userId === user.uid ? 'order-2' : 'order-1'}`}>
        {message.userId !== user.uid && (
          <div className="flex items-center gap-1 mb-1 ml-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{message.userName}</p>
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2 ${
          message.userId === user.uid
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
        }`}>
          <p className="text-sm break-words">{message.text}</p>
          <p className="text-xs opacity-70 mt-1">
            {message.timestamp?.toDate ? 
              new Date(message.timestamp.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) :
              new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        {/* Tabs Navegação */}
        <div className="bg-white dark:bg-gray-800 border-b px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('feed')}
              className={`py-3 px-2 font-medium transition-all relative ${
                activeTab === 'feed' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📱 Feed
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3 px-2 font-medium transition-all relative ${
                activeTab === 'chat' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💬 Chat Global
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`py-3 px-2 font-medium transition-all relative ${
                activeTab === 'friends' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Amigos ({friends.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* FEED */}
          {activeTab === 'feed' && (
            <div className="h-full overflow-y-auto p-6" ref={feedRef}>
              <div className="max-w-2xl mx-auto">
                {/* Botão Novo Post */}
                <button
                  onClick={() => setShowNewPostModal(true)}
                  className="w-full mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-left hover:shadow-xl transition-all flex items-center gap-3"
                >
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <FaUserCircle className="text-3xl text-gray-400" />
                  )}
                  <span className="text-gray-500">O que você está estudando hoje?</span>
                </button>

                {/* Posts */}
                {posts.length === 0 ? (
                  <div className="text-center text-gray-500 py-20">
                    <div className="text-6xl mb-4">📭</div>
                    <p>Nenhum post ainda</p>
                    <p className="text-sm">Seja o primeiro a compartilhar algo!</p>
                  </div>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            </div>
          )}

          {/* CHAT GLOBAL */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <div className="text-6xl mb-4">💬</div>
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
                  </div>
                ) : (
                  messages.map((msg) => <ChatMessageComponent key={msg.id} message={msg} />)
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Chat */}
              <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Mensagem global..."
                      rows={1}
                      className="w-full px-4 py-3 pr-20 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
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
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <FaPaperPlane size={16} /> Enviar
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  🌟 Compartilhe dúvidas, dicas de estudo e conteúdos relevantes
                </p>
              </div>
            </div>
          )}

          {/* AMIGOS / ENCONTRAR PESSOAS */}
          {activeTab === 'friends' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                {/* Buscar Usuários */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">🔍 Encontrar Amigos</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nome ou email..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                    >
                      <FaSearch /> Buscar
                    </button>
                  </div>

                  {/* Resultados da Busca */}
                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {searchResults.map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            {result.photoURL ? (
                              <img src={result.photoURL} alt={result.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <FaUserCircle className="text-3xl text-gray-400" />
                            )}
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">{result.name}</p>
                              <p className="text-xs text-gray-500">{result.course || 'Estudante'}</p>
                            </div>
                          </div>
                          {friends.includes(result.id) ? (
                            <button
                              onClick={() => handleUnfollow(result.id)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm"
                            >
                              Seguindo
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFollow(result.id)}
                              className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1"
                            >
                              <FaUserPlus size={12} /> Seguir
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de Amigos */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">👥 Seus Amigos</h3>
                  {friends.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Você ainda não tem amigos</p>
                      <p className="text-sm">Busque por pessoas acima para começar!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {friends.map((friendId) => (
                        <div key={friendId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            <FaUserCircle className="text-3xl text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">Amigo</p>
                              <p className="text-xs text-gray-500">ID: {friendId.slice(0, 8)}...</p>
                            </div>
                          </div>
                          <button className="text-purple-600 text-sm">💬 Mensagem</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Novo Post */}
        {showNewPostModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Criar Post</h3>
                <button onClick={() => setShowNewPostModal(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-4">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="O que você está estudando? Compartilhe com a comunidade!"
                  rows={4}
                  className="w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                />
                {newPostImage && (
                  <div className="mt-3 relative">
                    <img src={newPostImage} alt="Preview" className="rounded-xl max-h-48 w-full object-cover" />
                    <button
                      onClick={() => setNewPostImage(null)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <label className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-center rounded-lg cursor-pointer hover:bg-gray-200 transition-all">
                    <FaImage className="inline mr-2" /> Adicionar Imagem
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setNewPostImage(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>
              <div className="p-4 border-t dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePost}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold"
                >
                  Publicar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialNetwork;