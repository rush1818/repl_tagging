// ctfe.js - Core Tagging Library

const prodCtfe = "https://www.googletagmanager.com";
const VALID_FRAMES = ["ALL", "MAIN", "IFRAME"];
const DEFAULT_IFRAME_CONFIG = { enabled: false, delay: 3 };

let ctfeUrl = localStorage.getItem("ctfeUrl") || prodCtfe;
let tags = [];
let iframeConfig = { ...DEFAULT_IFRAME_CONFIG };

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

(function initializeFromUrl() {
  const params = new URL(document.location).searchParams;

  const tagsParam = params.get("tags");
  if (tagsParam) {
    try {
      tags = normalizeTags(JSON.parse(tagsParam));
      localStorage.setItem("tagsRemoved", tags.length === 0 ? "true" : "false");
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
})();

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

function loadGtmTag(idToLoad) {
  (function (w, d, s, l, i) {
    if (!Array.isArray(w[l])) {
      w[l] = [];
    }
    w[l].push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = ctfeUrl + "/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", idToLoad);
}

function loadGoogleTag(idToLoad) {
  const el = document.createElement("script");
  el.async = true;
  el.src = ctfeUrl + "/gtag/js?id=" + idToLoad;
  document.head.appendChild(el);

  if (!Array.isArray(window.dataLayer)) {
    window.dataLayer = [];
  }
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
  }
  window.gtag("config", idToLoad);
}

function getTags() {
  return tags;
}

function setTags(newTags) {
  tags = normalizeTags(newTags);
  localStorage.setItem("tags", JSON.stringify(tags));
  localStorage.setItem("tagsRemoved", tags.length === 0 ? "true" : "false");
}

function getCtfeUrl() {
  return ctfeUrl;
}

function setCtfeUrl(url) {
  ctfeUrl = url || prodCtfe;
  removeTrailing();
  localStorage.setItem("ctfeUrl", ctfeUrl);
}

function getIframeConfig() {
  return { ...iframeConfig };
}

function setIframeConfig(newConfig) {
  iframeConfig = normalizeIframeConfig(newConfig);
  localStorage.setItem("iframe", JSON.stringify(iframeConfig));
}

// Auto load tags on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  loadTags();
});
