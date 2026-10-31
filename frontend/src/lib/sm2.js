// Repetição espaçada (SM-2 simplificado). Funções puras: não tocam no Firestore.

export const DAY_MS = 24 * 60 * 60 * 1000;
export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

// Notas do aluno -> qualidade SM-2 (0 a 5). Abaixo de 3 conta como esquecido.
export const QUALITY = { AGAIN: 1, HARD: 3, GOOD: 4, EASY: 5 };

export const isRemembered = (quality) => quality >= 3;

// Estado inicial de um cartão novo (devido imediatamente).
export function newCardState(now = Date.now()) {
  return { ease: DEFAULT_EASE, interval: 0, repetitions: 0, due: now, lastReviewed: null };
}

// Calcula o novo agendamento depois de uma resposta.
// - Esqueceu (q < 3): zera as repetições e volta amanhã.
// - Lembrou: 1 dia, depois 6 dias, depois intervalo anterior x facilidade.
// - A facilidade sobe com respostas fáceis e cai com difíceis (mínimo 1,3).
// "Difícil" cresce o intervalo mais devagar que "Bom"/"Fácil".
export function nextReview(card, quality, now = Date.now()) {
  const q = Math.max(0, Math.min(5, quality));
  let { ease = DEFAULT_EASE, interval = 0, repetitions = 0 } = card || {};

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.max(interval + 1, Math.round(interval * ease * (q === 3 ? 0.8 : 1)));
    repetitions += 1;
  }

  ease = Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  ease = Math.round(ease * 100) / 100;

  return { ease, interval, repetitions, due: now + interval * DAY_MS, lastReviewed: now };
}

export const isDue = (card, now = Date.now()) => (card && typeof card.due === 'number' ? card.due <= now : true);

// Porcentagem de lembrados (0-100), arredondada. 0 se não houve revisões.
export function retentionPercent(remembered, total) {
  return total > 0 ? Math.round((remembered / total) * 100) : 0;
}

// Texto curto do próximo intervalo, para mostrar nos botões ("1 dia", "6 dias").
export function formatInterval(days) {
  if (days <= 0) return 'agora';
  if (days === 1) return '1 dia';
  if (days < 30) return `${days} dias`;
  const months = Math.round(days / 30);
  return months === 1 ? '1 mês' : `${months} meses`;
}
