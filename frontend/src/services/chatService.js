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
  setDoc,
  deleteDoc,
  where,
  serverTimestamp
} from '../config/firebase';

// ========== MENSAGENS GLOBAIS (Rede Social) ==========

// Enviar mensagem no feed global
export const sendGlobalMessage = async (userId, userName, userPhoto, text) => {
  try {
    await addDoc(collection(db, 'messages'), {
      userId: userId,
      userName: userName,
      userPhoto: userPhoto || null,
      text: text,
      timestamp: serverTimestamp(),
      likes: [],
      replies: []
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Escutar mensagens globais em tempo real
export const listenGlobalMessages = (callback, limitCount = 50) => {
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
    callback(messages);
  });
};

// Curtir mensagem
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

// Listar todos os grupos públicos
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
    
    // Se tiver arquivo, adiciona dados temporários (não salvos permanentemente)
    if (fileData) {
      messageData.file = {
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        data: fileData.data // Base64 temporário
      };
    }
    
    await addDoc(collection(db, 'groups', groupId, 'messages'), messageData);
    
    // Atualizar timestamp do grupo
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
    orderBy('timestamp', 'asc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
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