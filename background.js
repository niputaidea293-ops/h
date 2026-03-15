const BRIDGE_ENDPOINT = "http://127.0.0.1:8787/api/search";
const DEFAULT_CLIENT_TOKEN = "solo-mi-pc-token";

const seenQueries = new Set();

async function getBridgeConfig() {
  const data = await browser.storage.local.get(["bridgeUrl", "clientToken"]);

  return {
    bridgeUrl: data.bridgeUrl || BRIDGE_ENDPOINT,
    clientToken: data.clientToken || DEFAULT_CLIENT_TOKEN
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

async function sendQueryToLocalBridge(query, pageUrl) {
  const { bridgeUrl, clientToken } = await getBridgeConfig();

  const response = await fetch(bridgeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Token": clientToken
    },
    body: JSON.stringify({ query, pageUrl, at: new Date().toISOString() })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bridge error ${response.status}: ${body.slice(0, 100)}`);
  }
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
    await sendQueryToLocalBridge(query, url);
  } catch (error) {
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("icon.svg"),
      title: "BurlonAI bridge error",
      message: String(error)
    });
  }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab?.url) {
    handleSearch(tab.url);
  }
});
