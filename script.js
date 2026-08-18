// script.js - UI and Event Handling for index.html and tracking events

document.addEventListener("DOMContentLoaded", () => {
  // Populate CTFE URL input
  const ctfeInput = document.getElementById("ctfeUrl");
  if (ctfeInput) {
    ctfeInput.value = getCtfeUrl();
  }

  // Populate Tags UI
  renderTagsUI();

  // Populate Header with loaded tags
  renderLoadedTagsHeader();

  setPageLink();
  setOutboundHrefs();

  // Keep pageLink updated live when user changes inputs/checkboxes
  document.addEventListener("input", (e) => {
    if (e.target.closest("#tagsContainer") || e.target.id === "ctfeUrl") {
      setPageLink();
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.closest("#tagsContainer") || e.target.id === "ctfeUrl") {
      setPageLink();
    }
  });
});

function renderTagsUI() {
  const container = document.getElementById("tagsContainer");
  if (!container) return;

  container.innerHTML = '';
  const tags = getTags();

  tags.forEach((tag) => {
    addTagRow(tag.id, tag.type, tag.isActive !== false);
  });
}

function renderLoadedTagsHeader() {
  const el = document.getElementById("loadedTags");
  if (!el) return;

  const activeTags = getTags().filter(t => t.isActive !== false);
  if (activeTags.length === 0) {
    el.innerText = 'None';
    return;
  }

  el.innerText = activeTags.map(t => `${t.id} (${t.type})`).join(', ');
}

function addTagRow(id = '', type = 'gtm', isActive = true) {
  const container = document.getElementById("tagsContainer");
  if (!container) return;

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
    <input type="text" class="tag-id" value="${id}" style="width: 150px; margin-right: 15px;">
    <label style="margin-right: 5px;">Type: </label>
    <select class="tag-type" style="margin-right: 15px;">
      <option value="gtm" ${type === 'gtm' ? 'selected' : ''}>GTM</option>
      <option value="gtag" ${type === 'gtag' ? 'selected' : ''}>GTAG</option>
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
    if (idInput && idInput.value.trim() !== '') {
      newTags.push({
        id: idInput.value.trim(),
        type: typeSelect ? typeSelect.value : 'gtm',
        isActive: activeCheckbox ? activeCheckbox.checked : true
      });
    }
  });

  setTags(newTags);

  // Reload page to apply changes
  window.location.reload();
}

function resetToGtm() {
  setTags([{ id: 'GTM-M8Z49QT', type: 'gtm', isActive: true }]);
  setCtfeUrl('');
  window.location.reload();
}

function resetToGte() {
  setTags([{ id: 'G-FJV8CPP1GC', type: 'gtag', isActive: true }]);
  setCtfeUrl('');
  window.location.reload();
}

function getCurrentFormTags() {
  const tagRows = document.querySelectorAll('.tag-row');
  if (tagRows.length === 0) return getTags();
  const formTags = [];
  tagRows.forEach(row => {
    const idInput = row.querySelector('.tag-id');
    const typeSelect = row.querySelector('.tag-type');
    const activeCheckbox = row.querySelector('.tag-active');
    if (idInput && idInput.value.trim() !== '') {
      formTags.push({
        id: idInput.value.trim(),
        type: typeSelect ? typeSelect.value : 'gtm',
        isActive: activeCheckbox ? activeCheckbox.checked : true
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



