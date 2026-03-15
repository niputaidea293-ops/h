const DEFAULT_API_KEY = 'AIzaSyDWYcb8zA6dco1K_QidJp2BXv0KU9UXfrw';
const DEFAULT_TONE = 'burlón, creativo y ligero';

const form = document.getElementById('searchForm');
const queryInput = document.getElementById('queryInput');
const resultCard = document.getElementById('resultCard');
const resultQuery = document.getElementById('resultQuery');
const resultText = document.getElementById('resultText');
const historyEl = document.getElementById('history');

const configDialog = document.getElementById('configDialog');
const toggleConfig = document.getElementById('toggleConfig');
const closeConfig = document.getElementById('closeConfig');
const saveConfig = document.getElementById('saveConfig');
const apiKeyInput = document.getElementById('apiKeyInput');
const toneInput = document.getElementById('toneInput');

function getSettings() {
  return {
    apiKey: localStorage.getItem('geminiApiKey') || DEFAULT_API_KEY,
    tone: localStorage.getItem('geminiTone') || DEFAULT_TONE
  };
}

function saveSettings() {
  localStorage.setItem('geminiApiKey', apiKeyInput.value.trim());
  localStorage.setItem('geminiTone', toneInput.value.trim());
}

function addHistory(query, roast) {
  const item = document.createElement('article');
  item.className = 'history-item';
  item.innerHTML = `<p class="query">${query}</p><p class="roast">${roast}</p>`;
  historyEl.prepend(item);
  while (historyEl.children.length > 6) historyEl.lastChild.remove();
}

async function roastSearch(query) {
  const { apiKey, tone } = getSettings();
  const prompt = `Actúa como buscador falso: no entregues enlaces. Responde solo con una burla breve en español. Tono: ${tone}. Búsqueda: "${query}".`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini ${response.status}: ${details.slice(0, 120)}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin burla disponible por ahora.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  resultCard.classList.remove('hidden');
  resultQuery.textContent = `Tú buscaste: ${query}`;
  resultText.textContent = 'Pensando burla...';

  try {
    const roast = await roastSearch(query);
    resultText.textContent = roast;
    addHistory(query, roast);
  } catch (error) {
    resultText.textContent = `Error: ${error.message}`;
  }
});

toggleConfig.addEventListener('click', () => {
  const { apiKey, tone } = getSettings();
  apiKeyInput.value = apiKey;
  toneInput.value = tone;
  configDialog.showModal();
});

closeConfig.addEventListener('click', () => configDialog.close());
saveConfig.addEventListener('click', () => {
  saveSettings();
  configDialog.close();
});
