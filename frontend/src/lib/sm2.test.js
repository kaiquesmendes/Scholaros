import test from 'node:test';
import assert from 'node:assert/strict';
import { nextReview, newCardState, QUALITY, isDue, retentionPercent, formatInterval, DAY_MS, MIN_EASE } from './sm2.js';

const NOW = 1_700_000_000_000;

test('cartão novo está devido e começa com facilidade 2,5', () => {
  const c = newCardState(NOW);
  assert.deepEqual(c, { ease: 2.5, interval: 0, repetitions: 0, due: NOW, lastReviewed: null });
  assert.equal(isDue(c, NOW), true);
});

test('sequência de acertos: 1 dia, 6 dias, depois cresce pela facilidade', () => {
  let c = newCardState(NOW);
  c = { ...c, ...nextReview(c, QUALITY.GOOD, NOW) };
  assert.equal(c.interval, 1);
  assert.equal(c.due, NOW + DAY_MS);
  c = { ...c, ...nextReview(c, QUALITY.GOOD, NOW) };
  assert.equal(c.interval, 6);
  c = { ...c, ...nextReview(c, QUALITY.GOOD, NOW) };
  assert.equal(c.interval, 15); // 6 x 2,5
  assert.equal(c.repetitions, 3);
});

test('esquecer zera as repetições e volta em 1 dia', () => {
  let c = { ease: 2.5, interval: 15, repetitions: 3, due: NOW };
  const r = nextReview(c, QUALITY.AGAIN, NOW);
  assert.equal(r.repetitions, 0);
  assert.equal(r.interval, 1);
  assert.equal(r.due, NOW + DAY_MS);
  assert.ok(r.ease < 2.5);
});

test('facilidade: fácil sobe, bom mantém, difícil e esquecer descem; nunca abaixo de 1,3', () => {
  const base = { ease: 2.5, interval: 6, repetitions: 2 };
  assert.ok(nextReview(base, QUALITY.EASY, NOW).ease > 2.5);
  assert.equal(nextReview(base, QUALITY.GOOD, NOW).ease, 2.5);
  assert.ok(nextReview(base, QUALITY.HARD, NOW).ease < 2.5);
  let c = { ease: 1.35, interval: 1, repetitions: 0 };
  for (let i = 0; i < 10; i++) c = { ...c, ...nextReview(c, QUALITY.AGAIN, NOW) };
  assert.equal(c.ease, MIN_EASE);
});

test('"difícil" cresce o intervalo mais devagar que "bom", mas sempre avança', () => {
  const base = { ease: 2.5, interval: 10, repetitions: 3 };
  const hard = nextReview(base, QUALITY.HARD, NOW).interval;
  const good = nextReview(base, QUALITY.GOOD, NOW).interval;
  assert.ok(hard < good);
  assert.ok(hard > 10);
});

test('qualidade fora do intervalo é limitada e cartão sem campos usa os padrões', () => {
  assert.equal(nextReview({}, 99, NOW).repetitions, 1);
  assert.equal(nextReview(undefined, -4, NOW).interval, 1);
});

test('isDue compara com o momento atual', () => {
  assert.equal(isDue({ due: NOW + 1 }, NOW), false);
  assert.equal(isDue({ due: NOW }, NOW), true);
  assert.equal(isDue({}, NOW), true);
});

test('retentionPercent e formatInterval', () => {
  assert.equal(retentionPercent(0, 0), 0);
  assert.equal(retentionPercent(7, 10), 70);
  assert.equal(retentionPercent(2, 3), 67);
  assert.equal(formatInterval(0), 'agora');
  assert.equal(formatInterval(1), '1 dia');
  assert.equal(formatInterval(6), '6 dias');
  assert.equal(formatInterval(30), '1 mês');
  assert.equal(formatInterval(90), '3 meses');
});
