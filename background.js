const GEMINI_MODEL = "gemini-1.5-flash";
const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_API_KEY = "AIzaSyDWYcb8zA6dco1K_QidJp2BXv0KU9UXfrw";
const DEFAULT_TONE = "sarcástico y gracioso";
const DEFAULT_MAX_WORDS = 18;

const seenQueries = new Set();

async function getApiKey() {
  const data = await browser.storage.local.get("geminiApiKey");
  return data.geminiApiKey || DEFAULT_API_KEY;
}

async function getToneSettings() {
  const data = await browser.storage.local.get(["aiTone", "aiMaxWords"]);

  return {
    tone: data.aiTone || DEFAULT_TONE,
    maxWords: Number.isInteger(data.aiMaxWords) && data.aiMaxWords > 0
      ? data.aiMaxWords
      : DEFAULT_MAX_WORDS
  };
}

function extractSearchQuery(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname;

    if (host.includes("google.")) return url.searchParams.get("q");
    if (host.includes("duckduckgo.com")) return url.searchParams.get("q");
    if (host.includes("bing.com")) return url.searchParams.get("q");

    return null;
  } catch {
    return null;
  }
}

async function generateRoast(query, apiKey, tone, maxWords) {
  if (!apiKey) {
    return "⚠️ Falta API key de Gemini. Guarda una en storage.local con la clave geminiApiKey.";
  }

  const prompt = `Eres una IA con tono ${tone}. Da una respuesta corta y burlona (máximo ${maxWords} palabras), sin insultos extremos, basada en esta búsqueda del usuario: "${query}".`;

  const response = await fetch(`${API_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    return `Error Gemini (${response.status}): ${body.slice(0, 100)}`;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || "No se pudo generar burla esta vez.";
}

async function handleSearch(url) {
  const query = extractSearchQuery(url);
  if (!query) return;

  const normalized = query.trim().toLowerCase();
  if (!normalized || seenQueries.has(normalized)) return;

  seenQueries.add(normalized);
  if (seenQueries.size > 100) {
    const first = seenQueries.values().next().value;
    seenQueries.delete(first);
  }

  try {
    const apiKey = await getApiKey();
    const { tone, maxWords } = await getToneSettings();
    const roast = await generateRoast(query, apiKey, tone, maxWords);

    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icon.svg"),
      title: `Buscaste: ${query}`,
      message: roast
    });
  } catch (error) {
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icon.svg"),
      title: "BurlonAI error",
      message: String(error)
    });
  }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab?.url) {
    handleSearch(tab.url);
  }
});
