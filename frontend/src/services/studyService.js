// frontend/src/services/studyService.js
// Dados de estudo do usuário no Firestore: redações, materiais de PDF e cartões de revisão.
// Tudo fica em subcoleções de users/{uid}, junto dos demais dados do usuário.
import {
  collection, doc, addDoc, getDocs, deleteDoc, updateDoc, query, orderBy, limit, where,
  writeBatch, getCountFromServer,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { newCardState, nextReview } from '../lib/sm2';

const col = (uid, name) => collection(db, 'users', uid, name);

// O Firestore rejeita `undefined`; isto remove esses campos de objetos/arrays aninhados.
const clean = (value) => JSON.parse(JSON.stringify(value));

const ok = (data = {}) => ({ success: true, ...data });
const fail = (error) => {
  console.error(error);
  return { success: false, error: error?.message || String(error) };
};

// ---------- Redações ----------

export async function saveEssay(uid, { mode, content, feedback, professorNotes }) {
  try {
    const ref = await addDoc(col(uid, 'essays'), clean({
      mode,
      content: String(content).slice(0, 20000),
      wordCount: String(content).trim().split(/\s+/).filter(Boolean).length,
      grade: feedback.grade,
      feedback,
      ...(professorNotes ? { professorNotes } : {}),
      createdAt: Date.now(),
    }));
    return ok({ id: ref.id });
  } catch (error) {
    return fail(error);
  }
}

export async function listEssays(uid, max = 30) {
  try {
    const snap = await getDocs(query(col(uid, 'essays'), orderBy('createdAt', 'desc'), limit(max)));
    return ok({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteEssay(uid, id) {
  try {
    await deleteDoc(doc(db, 'users', uid, 'essays', id));
    return ok();
  } catch (error) {
    return fail(error);
  }
}

// ---------- Materiais de PDF ----------

export async function saveMaterial(uid, data) {
  try {
    const ref = await addDoc(col(uid, 'materials'), clean({
      fileName: data.fileName,
      pageCount: data.pageCount || 0,
      summary: data.summary || '',
      flashcards: data.flashcards || [],
      questions: data.questions || [],
      mindMap: data.mindMap || null,
      coveragePercent: data.coveragePercent ?? 100,
      createdAt: Date.now(),
    }));
    return ok({ id: ref.id });
  } catch (error) {
    return fail(error);
  }
}

export async function listMaterials(uid, max = 30) {
  try {
    const snap = await getDocs(query(col(uid, 'materials'), orderBy('createdAt', 'desc'), limit(max)));
    return ok({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    return fail(error);
  }
}

// Apaga o material e os cartões de revisão que vieram dele.
export async function deleteMaterial(uid, id) {
  try {
    const cards = await getDocs(query(col(uid, 'cards'), where('materialId', '==', id)));
    const batch = writeBatch(db);
    cards.forEach((c) => batch.delete(c.ref));
    batch.delete(doc(db, 'users', uid, 'materials', id));
    await batch.commit();
    return ok({ removedCards: cards.size });
  } catch (error) {
    return fail(error);
  }
}

// ---------- Cartões de revisão ----------

// Cria os cartões de um material no baralho. Cada cartão nasce devido hoje.
export async function addCardsFromMaterial(uid, materialId, source, flashcards) {
  try {
    const now = Date.now();
    const batch = writeBatch(db);
    flashcards.forEach((card) => {
      batch.set(doc(col(uid, 'cards')), clean({
        question: card.question,
        answer: card.answer,
        materialId,
        source,
        createdAt: now,
        ...newCardState(now),
      }));
    });
    await batch.commit();
    return ok({ added: flashcards.length });
  } catch (error) {
    return fail(error);
  }
}

export async function listDueCards(uid, now = Date.now(), max = 50) {
  try {
    const snap = await getDocs(query(col(uid, 'cards'), where('due', '<=', now), orderBy('due', 'asc'), limit(max)));
    return ok({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    return fail(error);
  }
}

// Totais do baralho sem baixar os documentos (consulta de contagem).
export async function getDeckStats(uid, now = Date.now()) {
  try {
    const [total, due] = await Promise.all([
      getCountFromServer(col(uid, 'cards')),
      getCountFromServer(query(col(uid, 'cards'), where('due', '<=', now))),
    ]);
    return ok({ total: total.data().count, due: due.data().count });
  } catch (error) {
    return fail(error);
  }
}

// Grava o novo agendamento do cartão depois de uma resposta.
export async function reviewCard(uid, card, quality, now = Date.now()) {
  try {
    const next = nextReview(card, quality, now);
    await updateDoc(doc(db, 'users', uid, 'cards', card.id), next);
    return ok({ next });
  } catch (error) {
    return fail(error);
  }
}
