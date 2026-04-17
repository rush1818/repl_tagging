// ctfe.js - Core Tagging Library

const prodCtfe = 'https://www.googletagmanager.com';
let ctfeUrl = localStorage.getItem('ctfeUrl') || prodCtfe;
let tags = [];

try {
  tags = JSON.parse(localStorage.getItem('tags')) || [];
} catch (e) {
  console.error("Failed to parse tags from localStorage", e);
  tags = [];
}

const tagsRemoved = localStorage.getItem('tagsRemoved') === 'true';

// Fallback to default if tags are empty and not explicitly removed
if (tags.length === 0 && !tagsRemoved) {
  tags.push({ id: 'GTM-M8Z49QT', type: 'gtm' });
}

removeTrailing();

(function initializeFromUrl() {
  const params = new URL(document.location).searchParams;

  const tagsParam = params.get("tags");
  if (tagsParam) {
    try {
      tags = JSON.parse(tagsParam);
      localStorage.setItem('tagsRemoved', tags.length === 0 ? 'true' : 'false');
    } catch (e) {
      console.error("Failed to parse tags from URL", e);
    }
  }

  const ctfeParam = params.get("ctfe");
  if (ctfeParam && ctfeParam.length) {
    try {
      new URL(ctfeParam);
      ctfeUrl = ctfeParam;
      removeTrailing();
    } catch (e) {}
  }
})();

function removeTrailing() {
  if (ctfeUrl.endsWith("/")) {
    ctfeUrl = ctfeUrl.slice(0, ctfeUrl.length - 1);
  }
}

function loadTags() {
  if (window.shouldLoadTags === false) return;
  tags.forEach(tag => {
    if (tag.type === 'gtm') {
      loadGtmTag(tag.id);
    } else if (tag.type === 'gtag') {
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
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
  }
  window.gtag("config", idToLoad);
}

function getTags() {
  return tags;
}

function setTags(newTags) {
  tags = newTags;
  localStorage.setItem('tags', JSON.stringify(tags));
  localStorage.setItem('tagsRemoved', tags.length === 0 ? 'true' : 'false');
}

function getCtfeUrl() {
  return ctfeUrl;
}

function setCtfeUrl(url) {
  ctfeUrl = url || prodCtfe;
  removeTrailing();
  localStorage.setItem('ctfeUrl', ctfeUrl);
}

// Auto load tags on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  loadTags();
});