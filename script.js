containerId = localStorage.getItem('containerId') || 'GTM-M8Z49QT';

isGtm = localStorage.getItem('isGtm') !== 'false';
ctfeUrl = localStorage.getItem('ctfeUrl') || 'https://www.googletagmanager.com';

(function initialize() {
  const params = new URL(document.location).searchParams;

  const tagId = params.get('tagId');
  if (tagId) {
    containerId = tagId;
  }

  const isGtmParam = params.get('isGtm');
  if (isGtmParam) {
    isGtm = isGtmParam !== 'false';
  }
})();


document.addEventListener("DOMContentLoaded", () => {
  setOnLoadCtfePath();
  setOnLoadContainerInput();
  setGtmVal();
  loadTag();
  setPageLink();
  setOutboundHrefs();
});

function loadTag() {
  if (window.loadTags === false) return;
  if (isGtm) {
    loadGtmTag();
  }
}

function loadGtmTag() {
  (function(w, d, s, l, i) {
    w[l] = w[l] || []; w[l].push({
      'gtm.start':
        new Date().getTime(), event: 'gtm.js'
    }); var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
        ctfeUrl + '/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', containerId);
}


function setOnLoadCtfePath() {
  const input = document.getElementById('ctfeUrl');
  if (!input) return;

  input.value = ctfeUrl;
}

function setGtmVal() {
  const select = document.getElementById('gtm');
  if (!select) return;

  select.value = isGtm ? 'gtm' : 'gte';
}


function setOnLoadContainerInput() {
  const input = document.getElementById('newContainer');
  if (!input) return;

  input.value = containerId;
}


function reset(gtmOrGte) {
  const isThisGtm = gtmOrGte === 'gtm'
  storeContainerInStore(isThisGtm ? '' : 'G-FJV8CPP1GC');
  setCtfeInStore('');
  setGtmInStore(isThisGtm);
  window.location = window.location.pathname;
}

function apply() {
  const input = document.getElementById('newContainer');
  if (!input) setDefaultContainer();
  storeContainerInStore(input.value);

  const ctfeInput = document.getElementById('ctfeUrl');
  setCtfeInStore(ctfeInput ? ctfeInput.value : "");

  const isGtm = document.getElementById('gtm');
  setGtmInStore(isGtm ? isGtm.value === 'gtm' : true);

  window.location = window.location.pathname;
}

function storeContainerInStore(val) {
  localStorage.setItem('containerId', val);
}

function setCtfeInStore(val) {
  localStorage.setItem('ctfeUrl', val || "");
}

function setGtmInStore(val) {
  localStorage.setItem('isGtm', val);
}

function setPageLink() {
  const el = document.getElementById('pageLink');
  if (!el) {
    return;
  }

  const url = new URL(document.location);
  url.searchParams.set('tagId', containerId);
  url.searchParams.set('isGtm', isGtm ? 'true' : 'false');
  el.innerText = url.href;
}

function next() {
  history.go(1);
}

function back() {
  history.go(-1);
}

setInterval(() => {
  const dl = document.getElementById('dataLayer');
  if (!dl) return;
  dl.innerText = JSON.stringify(window.dataLayer, 0, 2);
}, 1000)


function addToCart() {
  if (!gtag) return;

  gtag("event", "add_to_cart", {
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
      }
    ]
  });
}

function purchase() {
  if (!gtag) return;
  const emailInput = document.querySelectorAll('input[name="email"]');
  if (emailInput && emailInput.length && false) {
    const emailValue = emailInput[0].value;
    gtag('set', 'user_data', {
      "email": emailValue,
    });
  }

  gtag("event", "purchase", {
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
      }
    ]
  });
}

function setOutboundHrefs() {
  const btn1 = document.getElementById('outbound');
  const btn2 = document.getElementById('outboundRedirect');

  const params = new URLSearchParams();
  // params.set('tagId', containerId);
  // params.set('isGtag', !isGtm);
  // params.set('ctfeUrl', ctfeUrl);
  params.set('redirect', window.location.href)

  if (btn1) {
    const url = `https://tagging.rushabhs.com/?${params}`;
    btn1.href = url;
  }

  if (btn2) {
    params.set('autoRedirect', true);
    const url = `https://tagging.rushabhs.com/?${params}`;
    btn2.href = url;
  }
}