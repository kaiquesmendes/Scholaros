// frontend/src/services/chatService.js
import { 
  db, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  where,
  serverTimestamp
} from '../config/firebase';

// ========== MENSAGENS GLOBAIS (Chat Global) ==========

// Enviar mensagem no chat global
export const sendGlobalMessage = async (userId, userName, userPhoto, text) => {
  try {
    await addDoc(collection(db, 'messages'), {
      userId: userId,
      userName: userName,
      userPhoto: userPhoto || null,
      text: text,
      timestamp: serverTimestamp(),
      likes: []
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Escutar mensagens globais em tempo real
export const listenGlobalMessages = (callback, limitCount = 100) => {
  const q = query(
    collection(db, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    // A query traz as N mais recentes (desc); a UI espera ordem cronológica.
    callback(messages.reverse());
  });
};

// Curtir mensagem global
export const likeMessage = async (messageId, userId) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (messageDoc.exists()) {
      const currentLikes = messageDoc.data().likes || [];
      const newLikes = currentLikes.includes(userId) 
        ? currentLikes.filter(id => id !== userId)
        : [...currentLikes, userId];
      
      await updateDoc(messageRef, { likes: newLikes });
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== POSTS (Feed Estilo Instagram) ==========

// Criar novo post
export const createPost = async (userId, userName, userPhoto, content, image) => {
  try {
    await addDoc(collection(db, 'posts'), {
      userId: userId,
      userName: userName,
      userPhoto: userPhoto || null,
      content: content,
      image: image || null,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Escutar posts em tempo real
export const listenPosts = (callback, limitCount = 50) => {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const posts = [];
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    callback(posts);
  });
};

// Curtir post
export const likePost = async (postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const currentLikes = postDoc.data().likes || [];
      const newLikes = currentLikes.includes(userId) 
        ? currentLikes.filter(id => id !== userId)
        : [...currentLikes, userId];
      
      await updateDoc(postRef, { likes: newLikes });
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Adicionar comentário em post
export const addComment = async (postId, userId, userName, text) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const newComment = {
      userId: userId,
      userName: userName,
      text: text,
      createdAt: new Date().toISOString(),
      likes: []
    };
    
    await updateDoc(postRef, {
      comments: arrayUnion(newComment)
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Curtir comentário
export const likeComment = async (postId, commentIndex, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const comments = postDoc.data().comments || [];
      if (comments[commentIndex]) {
        const currentLikes = comments[commentIndex].likes || [];
        const newLikes = currentLikes.includes(userId) 
          ? currentLikes.filter(id => id !== userId)
          : [...currentLikes, userId];
        
        comments[commentIndex].likes = newLikes;
        await updateDoc(postRef, { comments: comments });
      }
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== AMIGOS / SEGUIR USUÁRIOS ==========

// Buscar usuários por nome ou email
export const searchUsers = async (searchQuery) => {
  try {
    const usersRef = collection(db, 'users');
    
    // Busca por nome
    const nameQuery = query(
      usersRef, 
      where('name', '>=', searchQuery), 
      where('name', '<=', searchQuery + '\uf8ff')
    );
    
    // Busca por email
    const emailQuery = query(
      usersRef, 
      where('email', '>=', searchQuery), 
      where('email', '<=', searchQuery + '\uf8ff')
    );
    
    const [nameSnapshot, emailSnapshot] = await Promise.all([
      getDocs(nameQuery),
      getDocs(emailQuery)
    ]);
    
    const usersMap = new Map();
    
    nameSnapshot.forEach((doc) => {
      usersMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    emailSnapshot.forEach((doc) => {
      if (!usersMap.has(doc.id)) {
        usersMap.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });
    
    return Array.from(usersMap.values());
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

// Seguir usuário
export const followUser = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId)
    });
    
    const targetUserRef = doc(db, 'users', targetUserId);
    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId)
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Deixar de seguir
export const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId)
    });
    
    const targetUserRef = doc(db, 'users', targetUserId);
    await updateDoc(targetUserRef, {
      followers: arrayRemove(currentUserId)
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Buscar amigos do usuário
export const getUserFriends = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const following = userDoc.data().following || [];
      const followers = userDoc.data().followers || [];
      return { success: true, following, followers };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== GRUPOS DE ESTUDO ==========

// Criar novo grupo
export const createGroup = async (groupId, groupData) => {
  try {
    await setDoc(doc(db, 'groups', groupId), {
      ...groupData,
      members: [groupData.ownerId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Listar grupos do usuário
export const listenUserGroups = (userId, callback) => {
  const q = query(
    collection(db, 'groups'),
    where('members', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const groups = [];
    snapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    callback(groups);
  });
};

// Listar todos os grupos
export const listenAllGroups = (callback) => {
  const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const groups = [];
    snapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    callback(groups);
  });
};

// Entrar em um grupo
export const joinGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sair de um grupo
export const leaveGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Remover membro do grupo (apenas owner)
export const removeGroupMember = async (groupId, userIdToRemove) => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (groupDoc.exists()) {
      const currentMembers = groupDoc.data().members || [];
      const newMembers = currentMembers.filter(id => id !== userIdToRemove);
      
      await updateDoc(groupRef, {
        members: newMembers,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    }
    return { success: false, error: 'Grupo não encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Adicionar membro ao grupo
export const addGroupMember = async (groupId, userIdToAdd) => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userIdToAdd),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Buscar membros do grupo
export const getGroupMembers = async (groupId) => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (groupDoc.exists()) {
      const members = groupDoc.data().members || [];
      return { success: true, members };
    }
    return { success: false, error: 'Grupo não encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Enviar mensagem em um grupo
export const sendGroupMessage = async (groupId, userId, userName, userPhoto, text, fileData = null) => {
  try {
    const messageData = {
      userId: userId,
      userName: userName,
      userPhoto: userPhoto || null,
      text: text,
      timestamp: serverTimestamp(),
      readBy: [userId]
    };
    
    if (fileData) {
      messageData.file = {
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        data: fileData.data
      };
    }
    
    await addDoc(collection(db, 'groups', groupId, 'messages'), messageData);
    
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, { updatedAt: serverTimestamp() });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Escutar mensagens de um grupo
export const listenGroupMessages = (groupId, callback, limitCount = 100) => {
  const q = query(
    collection(db, 'groups', groupId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    // A query traz as N mais recentes (desc); a UI espera ordem cronológica.
    callback(messages.reverse());
  });
};

// Marcar mensagem como lida
export const markMessageAsRead = async (groupId, messageId, userId) => {
  try {
    const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
    await updateDoc(messageRef, {
      readBy: arrayUnion(userId)
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Deletar grupo (apenas owner)
export const deleteGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (groupDoc.exists() && groupDoc.data().ownerId === userId) {
      await deleteDoc(groupRef);
      return { success: true };
    }
    return { success: false, error: 'Apenas o criador pode deletar o grupo' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== MENSAGENS PRIVADAS ==========

// Enviar mensagem privada
export const sendPrivateMessage = async (fromUserId, toUserId, fromName, toName, text) => {
  try {
    const chatId = [fromUserId, toUserId].sort().join('_');
    await addDoc(collection(db, 'private_messages', chatId, 'messages'), {
      fromUserId: fromUserId,
      toUserId: toUserId,
      fromName: fromName,
      toName: toName,
      text: text,
      timestamp: serverTimestamp(),
      read: false
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Escutar mensagens privadas
export const listenPrivateMessages = (userId, otherUserId, callback) => {
  const chatId = [userId, otherUserId].sort().join('_');
  const q = query(
    collection(db, 'private_messages', chatId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    // A query traz as N mais recentes (desc); a UI espera ordem cronológica.
    callback(messages.reverse());
  });
};