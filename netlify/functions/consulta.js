// consulta.js – Backend Node.js para endpoints de análisis y evaluación de prompts

// === IMPORTACIONES ===
const express = require('express');
const axios = require('axios');
const serverless = require('serverless-http');

// === CONFIGURACIÓN ===
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const DEEPSEEK_CHAT_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';  // Ajusta al modelo deseado

if (!DEEPSEEK_KEY) {
  console.error('ERROR: DEEPSEEK_KEY no definida en variables de entorno');
}

// === APP Y ROUTER ===
const app = express();
const router = express.Router();
app.use(express.json());

// Helper para llamar a Deepseek Chat
async function callDeepseek(messages) {
  const payload = {
    model: DEEPSEEK_MODEL,
    messages,
  };
  const headers = {
    'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    'Content-Type': 'application/json',
  };
  const resp = await axios.post(DEEPSEEK_CHAT_API_URL, payload, { headers });
  return resp.data.choices[0].message.content;
}

// === ENDPOINT: /api/analyze ===
router.post('/analyze', async (req, res) => {
  const { rol, objetivo, contexto } = req.body;
  // Construir prompt para evaluar estructura básica
  const userPrompt = 
    `Eres un experto pedagógico. Evalúa este prompt:
` +
    `Rol: ${rol}
` +
    `Objetivo: ${objetivo}
` +
    `Contexto: ${contexto}
` +
    `
Responde estrictamente en JSON con llaves: ok (boolean), score (0-100), suggestions (string con recomendaciones).`;
  try {
    const aiResponse = await callDeepseek([
      { role: 'system', content: 'Evalúa la calidad de prompts siguiendo criterios de claridad y especificidad.' },
      { role: 'user', content: userPrompt }
    ]);
    const result = JSON.parse(aiResponse);
    res.json(result);
  } catch (error) {
    console.error('Error /analyze:', error.message);
    res.status(500).json({ error: 'Error al analizar prompt.' });
  }
});

// === ENDPOINT: /api/evaluate ===
router.post('/evaluate', async (req, res) => {
  const { studentPrompt } = req.body;
  // Construir prompt para evaluación completa
  const userPrompt = 
    `Eres un revisor de prompts. Evalúa este prompt completo:
` +
    `${studentPrompt}
` +
    `
Responde estrictamente en JSON con: ok (boolean), score (0-100), suggestions (string con feedback detallado).`;
  try {
    const aiResponse = await callDeepseek([
      { role: 'system', content: 'Proporciona retroalimentación detallada de prompts.' },
      { role: 'user', content: userPrompt }
    ]);
    const result = JSON.parse(aiResponse);
    res.json(result);
  } catch (error) {
    console.error('Error /evaluate:', error.message);
    res.status(500).json({ error: 'Error al evaluar prompt.' });
  }
});

// === MOUNT Y EXPORT ===
app.use('/api', router);
module.exports.handler = serverless(app);
