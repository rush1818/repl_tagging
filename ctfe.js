// ctfe.js - Core Tagging Library

const prodCtfe = "https://www.googletagmanager.com";
const VALID_FRAMES = ["ALL", "MAIN", "IFRAME"];
const DEFAULT_IFRAME_CONFIG = { enabled: false, delay: 3 };

let ctfeUrl = prodCtfe;
let tags = [];
let iframeConfig = { ...DEFAULT_IFRAME_CONFIG };

const SYNC_PRIMARY_HOST = "www2.rushabhs.com";
const SYNC_SECONDARY_HOST = "www3.rushabhs.com";
const SYNC_PRIMARY_ORIGIN = "https://" + SYNC_PRIMARY_HOST;
const SYNC_IFRAME_URL = SYNC_PRIMARY_ORIGIN + "/repl_tagging/sync.html";
const IS_SECONDARY_HOST =
  typeof window !== "undefined" &&
  window.location &&
  window.location.hostname === SYNC_SECONDARY_HOST;

let syncIframeEl = null;
let syncReady = false;
const pendingSyncMessages = [];

function postToSyncFrame(message) {
  if (!IS_SECONDARY_HOST) return;
  if (syncReady && syncIframeEl && syncIframeEl.contentWindow) {
    syncIframeEl.contentWindow.postMessage(message, SYNC_PRIMARY_ORIGIN);
  } else {
    pendingSyncMessages.push(message);
  }
}

function syncStorageSet(key, value) {
  if (!IS_SECONDARY_HOST) return;
  postToSyncFrame({ type: "SET", key, value });
}

if (typeof window !== "undefined") {
  window.syncStorageSet = syncStorageSet;
}

function normalizeFrame(frame) {
  if (typeof frame === "string") {
    const upper = frame.toUpperCase();
    if (VALID_FRAMES.includes(upper)) {
      return upper;
    }
  }
  return "ALL";
}

function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) return [];
  return rawTags.map((tag) => ({
    id: tag.id || "",
    type: tag.type || "gtm",
    isActive: tag.isActive !== false,
    frame: normalizeFrame(tag.frame),
  }));
}

function normalizeIframeConfig(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_IFRAME_CONFIG };
  }
  const parsedDelay = Number(raw.delay);
  return {
    enabled: Boolean(raw.enabled),
    delay:
      Number.isFinite(parsedDelay) && parsedDelay >= 0
        ? parsedDelay
        : DEFAULT_IFRAME_CONFIG.delay,
  };
}

function loadStateFromStorage() {
  ctfeUrl = localStorage.getItem("ctfeUrl") || prodCtfe;
  tags = [];
  iframeConfig = { ...DEFAULT_IFRAME_CONFIG };

  try {
    tags = normalizeTags(JSON.parse(localStorage.getItem("tags")));
  } catch (e) {
    console.error("Failed to parse tags from localStorage", e);
    tags = [];
  }

  try {
    const storedIframe = localStorage.getItem("iframe");
    if (storedIframe) {
      iframeConfig = normalizeIframeConfig(JSON.parse(storedIframe));
    }
  } catch (e) {
    console.error("Failed to parse iframe config from localStorage", e);
    iframeConfig = { ...DEFAULT_IFRAME_CONFIG };
  }

  const tagsRemoved = localStorage.getItem("tagsRemoved") === "true";

  // Fallback to default if tags are empty and not explicitly removed
  if (tags.length === 0 && !tagsRemoved) {
    tags.push({ id: "GTM-M8Z49QT", type: "gtm", isActive: true, frame: "ALL" });
  }

  removeTrailing();
}

function initializeFromUrl() {
  const params = new URL(document.location).searchParams;

  const tagsParam = params.get("tags");
  if (tagsParam) {
    try {
      tags = normalizeTags(JSON.parse(tagsParam));
      const removedVal = tags.length === 0 ? "true" : "false";
      localStorage.setItem("tagsRemoved", removedVal);
      syncStorageSet("tagsRemoved", removedVal);
    } catch (e) {
      console.error("Failed to parse tags from URL", e);
    }
  }

  const tagIdParam = params.get("tagId");
  if (!tagsParam && tagIdParam) {
    const isGtmParam = params.get("isGtm");
    const isGtm = isGtmParam !== null ? isGtmParam !== "false" : tagIdParam.startsWith("GTM-");
    tags = [{ id: tagIdParam, type: isGtm ? "gtm" : "gtag", isActive: true, frame: "ALL" }];
  }

  const ctfeParam = params.get("ctfe");
  if (ctfeParam && ctfeParam.length) {
    try {
      new URL(ctfeParam);
      ctfeUrl = ctfeParam;
      removeTrailing();
    } catch (e) {}
  }

  const iframeParam = params.get("iframe");
  if (iframeParam) {
    try {
      iframeConfig = normalizeIframeConfig(JSON.parse(iframeParam));
    } catch (e) {
      console.error("Failed to parse iframe config from URL", e);
    }
  }
}

loadStateFromStorage();
initializeFromUrl();

function removeTrailing() {
  if (ctfeUrl.endsWith("/")) {
    ctfeUrl = ctfeUrl.slice(0, ctfeUrl.length - 1);
  }
}

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function shouldLoadTagInCurrentFrame(tag) {
  const frame = normalizeFrame(tag && tag.frame);
  if (frame === "ALL") return true;
  const inIframe = isInIframe();
  if (frame === "IFRAME") return inIframe;
  if (frame === "MAIN") return !inIframe;
  return true;
}

function loadTags() {
  if (window.shouldLoadTags === false) return;
  tags.forEach((tag) => {
    if (tag.isActive === false) return;
    if (!shouldLoadTagInCurrentFrame(tag)) return;
    if (tag.type === "gtm") {
      loadGtmTag(tag.id);
    } else if (tag.type === "gtag") {
      loadGoogleTag(tag.id);
    }
  });
}

let gtagJsInitialized = false;

function ensureGtag() {
  if (!Array.isArray(window.dataLayer)) {
    window.dataLayer = [];
  }
  if (typeof window.gtag !== "function") {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }
  const hasJsCommand =
    gtagJsInitialized ||
    window.dataLayer.some((entry) => entry && entry[0] === "js");
  if (!hasJsCommand) {
    gtagJsInitialized = true;
    window.gtag("js", new Date());
  }
}

function loadGtmTag(idToLoad) {
  const el = document.createElement("script");
  el.async = true;
  el.src = ctfeUrl + "/gtm.js?id=" + idToLoad;
  document.head.appendChild(el);

  ensureGtag();
}

function loadGoogleTag(idToLoad) {
  const el = document.createElement("script");
  el.async = true;
  el.src = ctfeUrl + "/gtag/js?id=" + idToLoad;
  document.head.appendChild(el);

  ensureGtag();
  window.gtag("config", idToLoad);
}

function getTags() {
  return tags;
}

function setTags(newTags) {
  tags = normalizeTags(newTags);
  const serialized = JSON.stringify(tags);
  const removedVal = tags.length === 0 ? "true" : "false";
  localStorage.setItem("tags", serialized);
  localStorage.setItem("tagsRemoved", removedVal);
  syncStorageSet("tags", serialized);
  syncStorageSet("tagsRemoved", removedVal);
}

function getCtfeUrl() {
  return ctfeUrl;
}

function setCtfeUrl(url) {
  ctfeUrl = url || prodCtfe;
  removeTrailing();
  localStorage.setItem("ctfeUrl", ctfeUrl);
  syncStorageSet("ctfeUrl", ctfeUrl);
}

function getIframeConfig() {
  return { ...iframeConfig };
}

function setIframeConfig(newConfig) {
  iframeConfig = normalizeIframeConfig(newConfig);
  const serialized = JSON.stringify(iframeConfig);
  localStorage.setItem("iframe", serialized);
  syncStorageSet("iframe", serialized);
}

function syncFromPrimaryOrigin() {
  if (!IS_SECONDARY_HOST || !document.body) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const requestId = "sync_" + Math.random().toString(36).slice(2);

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timeoutId = setTimeout(finish, 1500);

    window.addEventListener("message", (event) => {
      if (event.origin !== SYNC_PRIMARY_ORIGIN) return;
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "SYNC_READY") {
        syncReady = true;
        while (pendingSyncMessages.length > 0) {
          event.source.postMessage(pendingSyncMessages.shift(), SYNC_PRIMARY_ORIGIN);
        }
        event.source.postMessage({ type: "GET_ALL", id: requestId }, SYNC_PRIMARY_ORIGIN);
      } else if (msg.type === "SYNC_STATE" && msg.id === requestId) {
        clearTimeout(timeoutId);
        const data = msg.data || {};
        for (const [key, val] of Object.entries(data)) {
          if (typeof val === "string") {
            localStorage.setItem(key, val);
          }
        }
        loadStateFromStorage();
        initializeFromUrl();
        window.dispatchEvent(new CustomEvent("storageSyncReady"));
        finish();
      }
    });

    syncIframeEl = document.createElement("iframe");
    syncIframeEl.src = SYNC_IFRAME_URL;
    syncIframeEl.style.display = "none";
    syncIframeEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(syncIframeEl);
  });
}

// Auto load tags on DOMContentLoaded (wait for primary-origin sync on www3)
document.addEventListener("DOMContentLoaded", () => {
  if (IS_SECONDARY_HOST) {
    syncFromPrimaryOrigin().then(() => {
      loadTags();
    });
  } else {
    loadTags();
  }
});
