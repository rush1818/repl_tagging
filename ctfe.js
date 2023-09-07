// Helper to change ctfe environments.

const prodCtfe = 'https://www.googletagmanager.com';
ctfeUrl = localStorage.getItem('ctfeUrl') || prodCtfe;

function setOnLoadCtfePath() {
  const input = document.getElementById('ctfeUrl');
  if (!input) return;

  input.value = ctfeUrl;
}

function setCtfeInStore(val) {
  localStorage.setItem('ctfeUrl', val || prodCtfe);
}

function reset() {
  setCtfeInStore('');
  window.location = window.location.pathname;
}

function apply() {
  const ctfeInput = document.getElementById('ctfeUrl');
  setCtfeInStore(ctfeInput ? ctfeInput.value : "");

  window.location = window.location.pathname;
}


document.addEventListener("DOMContentLoaded", () => {
  setOnLoadCtfePath();
});