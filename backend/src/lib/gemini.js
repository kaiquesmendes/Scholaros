'use strict';

// Camada fina sobre o SDK do Gemini: um único lugar para modelo, saída estruturada
// (JSON com schema) e chat. O restante do backend não importa o SDK diretamente.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Modelos "preview" podem ser descontinuados sem aviso: configure GEMINI_MODEL no ambiente.
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

let client = null;
function getClient() {
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
}

function getModel({ systemInstruction, generationConfig } = {}) {
  return getClient().getGenerativeModel({
    model: MODEL_NAME,
    ...(systemInstruction ? { systemInstruction } : {}),
    ...(generationConfig ? { generationConfig } : {}),
  });
}

// Extrai JSON de uma resposta de texto: aceita cercas ```json, texto antes/depois e
// tanto objetos quanto arrays. Devolve null se nada parseável for encontrado.
function parseJSON(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    /* tenta extrair abaixo */
  }

  const firstObj = cleaned.indexOf('{');
  const firstArr = cleaned.indexOf('[');
  const candidates = [];
  if (firstObj !== -1) candidates.push([firstObj, cleaned.lastIndexOf('}')]);
  if (firstArr !== -1) candidates.push([firstArr, cleaned.lastIndexOf(']')]);
  candidates.sort((a, b) => a[0] - b[0]);

  for (const [start, end] of candidates) {
    if (end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (_) {
        /* próximo candidato */
      }
    }
  }
  return null;
}

async function generateText(prompt, { systemInstruction, maxOutputTokens, temperature } = {}) {
  const generationConfig = {};
  if (maxOutputTokens) generationConfig.maxOutputTokens = maxOutputTokens;
  if (temperature !== undefined) generationConfig.temperature = temperature;

  const model = getModel({
    systemInstruction,
    generationConfig: Object.keys(generationConfig).length ? generationConfig : undefined,
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Gera JSON validado por schema (saída estruturada). Se o modelo não aceitar o schema
// (HTTP 400) ou devolver algo não parseável, tenta uma vez em modo texto livre.
// Erros de cota/rede (429, 5xx) sobem direto: repetir a chamada não ajudaria.
async function generateJSON(prompt, schema, { systemInstruction, temperature = 0.2 } = {}) {
  try {
    const model = getModel({
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature,
      },
    });
    const result = await model.generateContent(prompt);
    const parsed = parseJSON(result.response.text());
    if (parsed !== null) return parsed;
  } catch (error) {
    if (error && error.status !== 400) throw error;
    console.warn('Saída estruturada indisponível, usando modo texto:', error.message);
  }

  const text = await generateText(`${prompt}\n\nResponda APENAS com JSON válido, sem texto extra.`, {
    systemInstruction,
    temperature,
  });
  return parseJSON(text);
}

// Conversa com histórico. `history` usa o formato do SDK: [{ role, parts: [{ text }] }].
async function chatReply({ systemInstruction, history, message }) {
  const chat = getModel({ systemInstruction }).startChat({ history });
  const result = await chat.sendMessage(message);
  return result.response.text();
}

module.exports = { MODEL_NAME, getModel, parseJSON, generateText, generateJSON, chatReply };
