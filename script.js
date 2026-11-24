// script.js - UI and Event Handling for index.html and tracking events

let iframeInjectTimer = null;
let iframeCountdownInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  // Populate CTFE URL input
  const ctfeInput = document.getElementById("ctfeUrl");
  if (ctfeInput) {
    ctfeInput.value = getCtfeUrl();
  }

  // Populate Tags UI
  renderTagsUI();

  // Populate Iframe UI
  renderIframeUI();

  // Populate Header with loaded tags
  renderLoadedTagsHeader();

  // Populate frame context indicator if present
  renderFrameContext();

  setPageLink();
  setOutboundHrefs();

  // Inject iframe automatically if enabled in iframe config
  initIframeInjection();

  // Keep pageLink and button labels updated live when user changes inputs/checkboxes
  document.addEventListener("input", (e) => {
    if (e.target.id === "iframeDelay") {
      updateLoadIframeButtonLabel();
      setPageLink();
      return;
    }
    if (e.target.closest("#tagsContainer") || e.target.id === "ctfeUrl") {
      setPageLink();
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "iframeDelay") {
      updateLoadIframeButtonLabel();
      setPageLink();
      return;
    }
    if (e.target.id === "injectIframe") {
      handleInjectIframeToggle(e.target.checked);
      setPageLink();
      return;
    }
    if (e.target.closest("#tagsContainer") || e.target.id === "ctfeUrl") {
      setPageLink();
    }
  });
});

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderTagsUI() {
  const container = document.getElementById("tagsContainer");
  if (!container) return;

  container.innerHTML = '';
  const tags = getTags();

  tags.forEach((tag) => {
    addTagRow(tag.id, tag.type, tag.isActive !== false, tag.frame || 'ALL');
  });
}

function renderIframeUI() {
  const checkbox = document.getElementById("injectIframe");
  const delayInput = document.getElementById("iframeDelay");
  if (!checkbox && !delayInput) return;

  const config = getIframeConfig();
  if (checkbox) {
    checkbox.checked = config.enabled;
  }
  if (delayInput) {
    delayInput.value = config.delay;
  }
  updateLoadIframeButtonLabel();
}

function renderFrameContext() {
  const el = document.getElementById("frameContext");
  if (!el) return;
  el.innerText = isInIframe() ? "Iframe" : "Top frame";
}

function renderLoadedTagsHeader() {
  const el = document.getElementById("loadedTags");
  if (!el) return;

  const activeTags = getTags().filter(
    t => t.isActive !== false && shouldLoadTagInCurrentFrame(t)
  );
  if (activeTags.length === 0) {
    el.innerText = 'None';
    return;
  }

  el.innerText = activeTags
    .map(t => `${t.id} (${t.type}, ${normalizeFrame(t.frame)})`)
    .join(', ');
}

function addTagRow(id = '', type = 'gtm', isActive = true, frame = 'ALL') {
  const container = document.getElementById("tagsContainer");
  if (!container) return;

  const normalizedFrame = normalizeFrame(frame);
  const row = document.createElement('div');
  row.className = 'tag-row';
  row.style.marginBottom = '10px';
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.flexWrap = 'wrap';
  row.style.gap = '10px';
  row.style.padding = '0';
  row.innerHTML = `
    <label style="display: flex; align-items: center; cursor: pointer; user-select: none;">
      <input type="checkbox" class="tag-active" ${isActive ? 'checked' : ''} style="margin-right: 5px; cursor: pointer;">
      Active
    </label>
    <label style="margin-right: 5px;">Tag ID: </label>
    <input type="text" class="tag-id" value="${escapeHtmlAttr(id)}" style="width: 150px; margin-right: 15px;">
    <label style="margin-right: 5px;">Type: </label>
    <select class="tag-type" style="margin-right: 15px;">
      <option value="gtm" ${type === 'gtm' ? 'selected' : ''}>GTM</option>
      <option value="gtag" ${type === 'gtag' ? 'selected' : ''}>GTAG</option>
    </select>
    <label style="margin-right: 5px;">Frame: </label>
    <select class="tag-frame" style="margin-right: 15px;">
      <option value="ALL" ${normalizedFrame === 'ALL' ? 'selected' : ''}>ALL</option>
      <option value="MAIN" ${normalizedFrame === 'MAIN' ? 'selected' : ''}>MAIN</option>
      <option value="IFRAME" ${normalizedFrame === 'IFRAME' ? 'selected' : ''}>IFRAME</option>
    </select>
    <button class="mdc-button mdc-button--outlined" style="margin-left: 0;" onclick="removeTagRow(this)">
      <span class="mdc-button__ripple"></span>Remove
    </button>
  `;
  container.appendChild(row);
  setPageLink();
}

function removeTagRow(button) {
  const row = button.closest('.tag-row');
  if (row) {
    row.remove();
    setPageLink();
  }
}

function reloadWithoutParams(paramsToRemove) {
  const url = new URL(window.location.href);
  let changed = false;
  paramsToRemove.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  });
  if (changed) {
    window.location.href = url.href;
  } else {
    window.location.reload();
  }
}

function stripUrlParamsInPlace(paramsToRemove) {
  const url = new URL(window.location.href);
  let changed = false;
  paramsToRemove.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  });
  if (changed) {
    try {
      window.history.replaceState({}, "", url.href);
    } catch (e) {}
  }
}

function applyChanges() {
  const ctfeInput = document.getElementById("ctfeUrl");
  if (ctfeInput) {
    setCtfeUrl(ctfeInput.value);
  }

  const tagRows = document.querySelectorAll('.tag-row');
  const newTags = [];
  tagRows.forEach(row => {
    const idInput = row.querySelector('.tag-id');
    const typeSelect = row.querySelector('.tag-type');
    const activeCheckbox = row.querySelector('.tag-active');
    const frameSelect = row.querySelector('.tag-frame');
    if (idInput && idInput.value.trim() !== '') {
      newTags.push({
        id: idInput.value.trim(),
        type: typeSelect ? typeSelect.value : 'gtm',
        isActive: activeCheckbox ? activeCheckbox.checked : true,
        frame: frameSelect ? normalizeFrame(frameSelect.value) : 'ALL'
      });
    }
  });

  setTags(newTags);

  if (document.getElementById("injectIframe") || document.getElementById("iframeDelay")) {
    setIframeConfig(getCurrentFormIframeConfig());
  }

  // Reload page to apply changes
  reloadWithoutParams(["tags", "tagId", "isGtm", "ctfe", "iframe"]);
}

function resetToGtm() {
  setTags([{ id: 'GTM-M8Z49QT', type: 'gtm', isActive: true, frame: 'ALL' }]);
  setCtfeUrl('');
  reloadWithoutParams(["tags", "tagId", "isGtm", "ctfe"]);
}

function resetToGte() {
  setTags([{ id: 'G-FJV8CPP1GC', type: 'gtag', isActive: true, frame: 'ALL' }]);
  setCtfeUrl('');
  reloadWithoutParams(["tags", "tagId", "isGtm", "ctfe"]);
}

function getFormIframeDelay() {
  const delayInput = document.getElementById("iframeDelay");
  if (!delayInput) return getIframeConfig().delay;
  if (delayInput.value === "") return 0;
  const parsed = Number(delayInput.value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getCurrentFormIframeConfig() {
  const checkbox = document.getElementById("injectIframe");
  const delayInput = document.getElementById("iframeDelay");
  if (!checkbox && !delayInput) return getIframeConfig();
  return {
    enabled: checkbox ? checkbox.checked : getIframeConfig().enabled,
    delay: getFormIframeDelay(),
  };
}

function updateLoadIframeButtonLabel() {
  const labelEl = document.getElementById("loadIframeBtnLabel");
  if (!labelEl) return;
  labelEl.innerText = `Load iframe in ${getFormIframeDelay()} s`;
}

function loadIframeWithDelay() {
  const delay = getFormIframeDelay();
  const checkbox = document.getElementById("injectIframe");
  if (checkbox) {
    checkbox.checked = true;
  }
  setIframeConfig({ enabled: true, delay });
  reloadWithoutParams(["iframe"]);
}

function cancelIframeTimers() {
  if (iframeInjectTimer !== null) {
    clearTimeout(iframeInjectTimer);
    iframeInjectTimer = null;
  }
  if (iframeCountdownInterval !== null) {
    clearInterval(iframeCountdownInterval);
    iframeCountdownInterval = null;
  }
}

function cancelAndClearIframe(statusMessage) {
  cancelIframeTimers();
  const container = document.getElementById("iframeContainer");
  if (container) {
    container.innerHTML = "";
  }
  const statusEl = document.getElementById("iframeStatus");
  if (statusEl) {
    statusEl.innerText = statusMessage || "";
  }
}

function handleInjectIframeToggle(enabled) {
  const delay = getFormIframeDelay();
  setIframeConfig({ enabled, delay });
  stripUrlParamsInPlace(["iframe"]);

  if (!enabled) {
    cancelAndClearIframe("Iframe injection disabled.");
  } else {
    const statusEl = document.getElementById("iframeStatus");
    const container = document.getElementById("iframeContainer");
    const hasIframe = container && container.querySelector("iframe");
    if (statusEl && !hasIframe && iframeInjectTimer === null) {
      statusEl.innerText = `Iframe injection enabled (delay: ${delay} s). Click "Load iframe in ${delay} s" or reload to inject.`;
    }
  }
}

function buildIframeSrc() {
  const iframeUrl = new URL("iframe.html", window.location.href);
  const currentParams = new URLSearchParams(window.location.search);
  ["tags", "tagId", "isGtm", "ctfe"].forEach((key) => {
    if (currentParams.has(key)) {
      iframeUrl.searchParams.set(key, currentParams.get(key));
    }
  });
  return iframeUrl.href;
}

function injectIframeNow() {
  cancelIframeTimers();
  const container = document.getElementById("iframeContainer");
  const statusEl = document.getElementById("iframeStatus");
  if (!container) return;

  container.innerHTML = "";
  const iframe = document.createElement("iframe");
  iframe.src = buildIframeSrc();
  iframe.title = "Embedded test iframe";
  iframe.className = "test-iframe";
  container.appendChild(iframe);

  if (statusEl) {
    statusEl.innerText = "Iframe loaded.";
  }
}

function initIframeInjection() {
  const container = document.getElementById("iframeContainer");
  if (!container || isInIframe()) return;

  const statusEl = document.getElementById("iframeStatus");
  const config = getIframeConfig();

  if (!config.enabled) {
    if (statusEl) {
      statusEl.innerText = "Iframe injection is disabled.";
    }
    return;
  }

  const delayMs = config.delay * 1000;
  if (delayMs <= 0) {
    injectIframeNow();
    return;
  }

  const targetTime = Date.now() + delayMs;
  const isFractional = config.delay % 1 !== 0;

  const updateCountdown = () => {
    if (!statusEl) return;
    const remainingSec = Math.max(0, (targetTime - Date.now()) / 1000);
    const formatted = isFractional
      ? remainingSec.toFixed(1)
      : Math.ceil(remainingSec).toString();
    statusEl.innerText = `Loading iframe in ${formatted} s...`;
  };

  updateCountdown();
  iframeCountdownInterval = setInterval(updateCountdown, isFractional ? 100 : 250);
  iframeInjectTimer = setTimeout(() => {
    injectIframeNow();
  }, delayMs);
}

function getCurrentFormTags() {
  const container = document.getElementById("tagsContainer");
  if (!container) return getTags();
  const tagRows = container.querySelectorAll('.tag-row');
  const formTags = [];
  tagRows.forEach(row => {
    const idInput = row.querySelector('.tag-id');
    const typeSelect = row.querySelector('.tag-type');
    const activeCheckbox = row.querySelector('.tag-active');
    const frameSelect = row.querySelector('.tag-frame');
    if (idInput && idInput.value.trim() !== '') {
      formTags.push({
        id: idInput.value.trim(),
        type: typeSelect ? typeSelect.value : 'gtm',
        isActive: activeCheckbox ? activeCheckbox.checked : true,
        frame: frameSelect ? normalizeFrame(frameSelect.value) : 'ALL'
      });
    }
  });
  return formTags;
}

function setPageLink() {
  const el = document.getElementById("pageLink");
  if (!el) return;

  const url = new URL(document.location);
  const ctfeInput = document.getElementById("ctfeUrl");
  const ctfe = ctfeInput ? ctfeInput.value : getCtfeUrl();
  if (ctfe) {
    url.searchParams.set("ctfe", ctfe);
  } else {
    url.searchParams.delete("ctfe");
  }
  url.searchParams.set("tags", JSON.stringify(getCurrentFormTags()));
  url.searchParams.set("iframe", JSON.stringify(getCurrentFormIframeConfig()));
  url.searchParams.delete("tagId");
  url.searchParams.delete("isGtm");
  el.innerText = url.href;
}

// Tracking events
function addToCart() {
  if (!window.gtag) return;
  window.gtag("event", "add_to_cart", {
    currency: "USD",
    value: 7.77,
    items: [
      {
        item_id: "SKU_12345",
        item_name: "Stan and Friends Tee",
        affiliation: "Google Merchandise Store",
        coupon: "SUMMER_FUN",
        currency: "USD",
        discount: 2.22,
      },
    ],
  });
}

function purchase() {
  if (!window.gtag) return;
  window.gtag("event", "purchase", {
    currency: "USD",
    transaction_id: Math.floor(Math.random() * 1000),
    value: 7.77,
    items: [
      {
        item_id: "SKU_12345",
        item_name: "Stan and Friends Tee",
        affiliation: "Google Merchandise Store",
        coupon: "SUMMER_FUN",
        currency: "USD",
        discount: 2.22,
      },
    ],
  });
}

function next() { history.go(1); }
function back() { history.go(-1); }

setInterval(() => {
  const dl = document.getElementById("dataLayer");
  if (!dl) return;
  dl.innerText = JSON.stringify(window.dataLayer, 0, 2);
}, 1000);

function setOutboundHrefs() {
  const btn1 = document.getElementById("outbound");
  const btn2 = document.getElementById("outboundRedirect");

  const params = new URLSearchParams();
  params.set("redirect", window.location.href);

  if (btn1) {
    const url = `https://tagging.rushabhs.com/?${params}`;
    btn1.href = url;
  }

  if (btn2) {
    params.set("autoRedirect", true);
    const url = `https://tagging.rushabhs.com/?${params}`;
    btn2.href = url;
  }
}



